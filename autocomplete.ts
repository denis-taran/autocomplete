/**
 * Copyright (c) 2016 Denys Krasnoshchok
 * 
 * Homepage: https://smartscheduling.com/en/documentation/autocomplete
 * Source: https://github.com/kraaden/autocomplete
 * 
 * MIT License
 */

export const enum EventTrigger {
    Keyboard = 0,
    Focus = 1,
    Mouse = 2,
    /**
     * Fetch is triggered manually by calling `fetch` function returned in `AutocompleteResult`
     */
    Manual = 3
}

export interface AutocompleteItem {
    label?: string;
    group?: string;
}

export interface AutocompleteEvent<T extends Event> {
    /**
     * Native event object passed by browser to the event handler
     */
    event: T;

    /**
     * Fetch data and display autocomplete
     */
    fetch: () => void;
}

export interface AutocompleteSettings<T extends AutocompleteItem> {
    /**
     * Autocomplete will be attached to this element.
     */
    input: HTMLInputElement | HTMLTextAreaElement;

    /**
     * Provide your own container for the widget.
     * If not specified, a new DIV element will be created.
     */
    container?: HTMLDivElement;

    /**
     * This method allows you to override the default rendering function for items.
     * It must return a DIV element or undefined to skip rendering.
     */
    render?: (item: T, currentValue: string, index: number) => HTMLDivElement | undefined;

    /**
     * This method allows you to override the default rendering function for item groups.
     * It must return a DIV element or undefined to skip rendering.
     */
    renderGroup?: (name: string, currentValue: string) => HTMLDivElement | undefined;

    /**
     * If specified, the autocomplete DOM element will have this class assigned to it.
     */
    className?: string;

    /**
     * Specify the minimum text length required to show autocomplete.
     */
    minLength?: number;

    /**
     * The message that will be showed when there are no suggestions that match the entered value.
     */
    emptyMsg?: string;

    /**
     * This method will be called when user choose an item in autocomplete. The selected item will be passed as the first parameter.
     */
    onSelect: (item: T, input: HTMLInputElement | HTMLTextAreaElement) => void;

    /**
     * Show autocomplete on focus event. Focus event will ignore the `minLength` property and will always call `fetch`.
     */
    showOnFocus?: boolean;

    /**
     * This method will be called to prepare suggestions and then pass them to autocomplete.
     * @param {string} text - text in the input field
     * @param {(items: T[] | false) => void} update - a callback function that must be called after suggestions are prepared
     * @param {EventTrigger} trigger - type of the event that triggered the fetch
     * @param {number} cursorPos - position of the cursor in the input field
     */
    fetch: (text: string, update: (items: T[] | false) => void, trigger: EventTrigger, cursorPos: number) => void;

    /**
     * Enforces that the fetch function will only be called once within the specified time frame (in milliseconds) and
     * delays execution. This prevents flooding your server with AJAX requests.
     */
    debounceWaitMs?: number;

    /**
     * Callback for additional autocomplete customization
     * @param {HTMLInputElement | HTMLTextAreaElement} input - input box associated with autocomplete
     * @param {ClientRect | DOMRect} inputRect - size of the input box and its position relative to the viewport
     * @param {HTMLDivElement} container - container with suggestions
     * @param {number} maxHeight - max height that can be used by autocomplete
     */
    customize?: (input: HTMLInputElement | HTMLTextAreaElement, inputRect: ClientRect | DOMRect, container: HTMLDivElement, maxHeight: number) => void;

    /**
     * Prevents automatic form submit when ENTER is pressed
     */
    preventSubmit?: boolean;

    /**
     * Prevents the first item in the list from being selected automatically. This option allows you
     * to submit a custom text by pressing ENTER even when autocomplete is displayed.
     */
    disableAutoSelect?: boolean;

    /**
     * Provide your keyup event handler to display autocomplete when a key is pressed that doesn't modify the content. You can also perform some additional actions.
     */
    keyup?: (e: AutocompleteEvent<KeyboardEvent>) => void;

    /**
     * Allows to display autocomplete on mouse clicks or perform some additional actions.
     */
    click?: (e: AutocompleteEvent<MouseEvent>) => void;
}

export interface AutocompleteResult {
    /**
     * Remove event handlers, DOM elements and ARIA/accessibility attributes created by the widget.
     */
    destroy: () => void;

    /**
     * This function allows to manually start data fetching and display autocomplete. Note that
     * it does not automatically place focus on the input field, so you may need to do so manually
     * in certain situations.
     */
    fetch: () => void;
}

export default function autocomplete<T extends AutocompleteItem>(settings: AutocompleteSettings<T>): AutocompleteResult {

    // just an alias to minimize JS file size
    const doc = document;

    const container: HTMLDivElement = settings.container || doc.createElement('div');
    container.id = container.id || 'autocomplete-' + uid();
    const containerStyle = container.style;
    const debounceWaitMs = settings.debounceWaitMs || 0;
    const preventSubmit = settings.preventSubmit || false;
    const disableAutoSelect = settings.disableAutoSelect || false;
    const customContainerParent = container.parentElement;

    let items: T[] = [];
    let inputValue = '';
    let minLen = 2;
    const showOnFocus = settings.showOnFocus;
    let selected: T | undefined;
    let fetchCounter = 0;
    let debounceTimer: number | undefined;
    let destroyed = false;

    // Fixes #104: autocomplete selection is broken on Firefox for Android
    let suppressAutocomplete = false;

    if (settings.minLength !== undefined) {
        minLen = settings.minLength;
    }

    if (!settings.input) {
        throw new Error('input undefined');
    }

    const input: HTMLInputElement | HTMLTextAreaElement = settings.input;

    container.className = 'autocomplete ' + (settings.className || '');
    container.setAttribute('role', 'listbox');

    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', container.id);
    input.setAttribute('aria-owns', container.id);
    input.setAttribute('aria-activedescendant', '');
    input.setAttribute('aria-haspopup', 'listbox');

    // IOS implementation for fixed positioning has many bugs, so we will use absolute positioning
    containerStyle.position = 'absolute';

    /**
     * Generate a very complex textual ID that greatly reduces the chance of a collision with another ID or text.
     */
    function uid(): string {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    /**
     * Detach the container from DOM
     */
    function detach() {
        const parent = container.parentNode;
        if (parent) {
            parent.removeChild(container);
        }
    }

    /**
     * Clear debouncing timer if assigned
     */
    function clearDebounceTimer() {
        if (debounceTimer) {
            window.clearTimeout(debounceTimer);
        }
    }

    /**
     * Attach the container to DOM
     */
    function attach() {
        if (!container.parentNode) {
            (customContainerParent || doc.body).appendChild(container);
        }
    }

    /**
     * Check if container for autocomplete is displayed
     */
    function containerDisplayed(): boolean {
        return !!container.parentNode;
    }

    /**
     * Clear autocomplete state and hide container
     */
    function clear() {
        // prevent the update call if there are pending AJAX requests
        fetchCounter++;

        items = [];
        inputValue = '';
        selected = undefined;
        input.setAttribute('aria-activedescendant', '');
        input.setAttribute('aria-expanded', 'false');
        detach();
    }

    /**
     * Update autocomplete position
     */
    function updatePosition() {
        if (!containerDisplayed()) {
            return;
        }

        input.setAttribute('aria-expanded', 'true');

        containerStyle.height = 'auto';
        containerStyle.width = input.offsetWidth + 'px';

        let maxHeight = 0;
        let inputRect: DOMRect | undefined;

        function calc() {
            const docEl = doc.documentElement as HTMLElement;
            const clientTop = docEl.clientTop || doc.body.clientTop || 0;
            const clientLeft = docEl.clientLeft || doc.body.clientLeft || 0;
            const scrollTop = window.pageYOffset || docEl.scrollTop;
            const scrollLeft = window.pageXOffset || docEl.scrollLeft;

            inputRect = input.getBoundingClientRect();

            const top = inputRect.top + input.offsetHeight + scrollTop - clientTop;
            const left = inputRect.left + scrollLeft - clientLeft;

            containerStyle.top = top + 'px';
            containerStyle.left = left + 'px';

            maxHeight = window.innerHeight - (inputRect.top + input.offsetHeight);

            if (maxHeight < 0) {
                maxHeight = 0;
            }

            containerStyle.top = top + 'px';
            containerStyle.bottom = '';
            containerStyle.left = left + 'px';
            containerStyle.maxHeight = maxHeight + 'px';
        }

        // the calc method must be called twice, otherwise the calculation may be wrong on resize event (chrome browser)
        calc();
        calc();

        if (settings.customize && inputRect) {
            settings.customize(input, inputRect, container, maxHeight);
        }
    }

    /**
     * Redraw the autocomplete div element with suggestions
     */
    function update() {

        container.innerHTML = '';
        input.setAttribute('aria-activedescendant', '');

        // function for rendering autocomplete suggestions
        let render = function (item: T, _: string, __: number): HTMLDivElement | undefined {
            const itemElement = doc.createElement('div');
            itemElement.textContent = item.label || '';
            return itemElement;
        };
        if (settings.render) {
            render = settings.render;
        }

        // function to render autocomplete groups
        let renderGroup = function (groupName: string, _: string): HTMLDivElement | undefined {
            const groupDiv = doc.createElement('div');
            groupDiv.textContent = groupName;
            return groupDiv;
        };
        if (settings.renderGroup) {
            renderGroup = settings.renderGroup;
        }

        const fragment = doc.createDocumentFragment();
        let prevGroup = uid();

        items.forEach(function (item: T, index: number): void {
            if (item.group && item.group !== prevGroup) {
                prevGroup = item.group;
                const groupDiv = renderGroup(item.group, inputValue);
                if (groupDiv) {
                    groupDiv.className += ' group';
                    fragment.appendChild(groupDiv);
                }
            }
            const div = render(item, inputValue, index);
            if (div) {
                div.id = `${container.id}_${index}`;
                div.setAttribute('role', 'option');
                div.addEventListener('click', function (ev: MouseEvent): void {
                    suppressAutocomplete = true;
                    try {
                        settings.onSelect(item, input);
                    } finally {
                        suppressAutocomplete = false;
                    }
                    clear();
                    ev.preventDefault();
                    ev.stopPropagation();
                });
                if (item === selected) {
                    div.className += ' selected';
                    div.setAttribute('aria-selected', 'true');
                    input.setAttribute('aria-activedescendant', div.id);
                }
                fragment.appendChild(div);
            }
        });
        container.appendChild(fragment);
        if (items.length < 1) {
            if (settings.emptyMsg) {
                const empty = doc.createElement('div');
                empty.id = `${container.id}_${uid()}`;
                empty.className = 'empty';
                empty.textContent = settings.emptyMsg;
                container.appendChild(empty);
                input.setAttribute('aria-activedescendant', empty.id);
            } else {
                clear();
                return;
            }
        }

        attach();
        updatePosition();

        updateScroll();
    }

    function updateIfDisplayed() {
        if (containerDisplayed()) {
            update();
        }
    }

    function resizeEventHandler() {
        updateIfDisplayed();
    }

    function scrollEventHandler(e: Event) {
        if (e.target !== container) {
            updateIfDisplayed();
        } else {
            e.preventDefault();
        }
    }

    function inputEventHandler() {
        if (!suppressAutocomplete) {
            fetch(EventTrigger.Keyboard);
        }
    }

    /**
     * Automatically move scroll bar if selected item is not visible
     */
    function updateScroll() {
        const elements = container.getElementsByClassName('selected');
        if (elements.length > 0) {
            let element = elements[0] as HTMLDivElement;

            // make group visible
            const previous = element.previousElementSibling as HTMLDivElement;
            if (previous && previous.className.indexOf('group') !== -1 && !previous.previousElementSibling) {
                element = previous;
            }

            if (element.offsetTop < container.scrollTop) {
                container.scrollTop = element.offsetTop;
            } else {
                const selectBottom = element.offsetTop + element.offsetHeight;
                const containerBottom = container.scrollTop + container.offsetHeight;
                if (selectBottom > containerBottom) {
                    container.scrollTop += selectBottom - containerBottom;
                }
            }
        }
    }

    function selectPreviousSuggestion() {
        const index = items.indexOf(selected!);

        selected = index === -1
            ? undefined
            : items[(index + items.length - 1) % items.length];

        updateSelectedSuggestion(index);
    }

    function selectNextSuggestion() {
        const index = items.indexOf(selected!);

        selected = items.length < 1
            ? undefined
            : index === -1
                ? items[0]
                : items[(index + 1) % items.length];

        updateSelectedSuggestion(index);
    }

    function updateSelectedSuggestion(index: number) {
        if (index > -1 && items.length > 0) {
            unselectSuggestion(index);
            selectSuggestion(items.indexOf(selected!));
            updateScroll();
        }
    }

    function selectSuggestion(index: number) {
        var element = doc.getElementById(container.id + "_" + index);
        if(element) {
            element.classList.add('selected');
            element.setAttribute('aria-selected', 'true');
            input.setAttribute('aria-activedescendant', element.id);
        }
    }

    function unselectSuggestion(index: number) {
        var element = doc.getElementById(container.id + "_" + index);
        if(element) {
            element.classList.remove('selected');
            element.removeAttribute('aria-selected');
            input.removeAttribute('aria-activedescendant');
        }
    }

    function handleArrowAndEscapeKeys(ev: KeyboardEvent, key: 'ArrowUp' | 'ArrowDown' | 'Escape') {
        const containerIsDisplayed = containerDisplayed();

        if (key === 'Escape') {
            clear();
        } else {
            if (!containerIsDisplayed || items.length < 1) {
                return;
            }
            key === 'ArrowUp'
                ? selectPreviousSuggestion()
                : selectNextSuggestion();
        }

        ev.preventDefault();

        if (containerIsDisplayed) {
            ev.stopPropagation();
        }
    }

    function handleEnterKey(ev: KeyboardEvent) {
        if (selected) {
            suppressAutocomplete = true;
            try {
                settings.onSelect(selected, input);
            } finally {
                suppressAutocomplete = false;
            }
            clear();
        }

        if (preventSubmit) {
            ev.preventDefault();
        }
    }

    function keydownEventHandler(ev: KeyboardEvent) {
        const key = ev.key;

        switch (key) {
            case 'ArrowUp':
            case 'ArrowDown':
            case 'Escape':
                handleArrowAndEscapeKeys(ev, key);
                break;
            case 'Enter':
                handleEnterKey(ev);
                break;
            default:
                break;
        }
    }

    function focusEventHandler() {
        if (showOnFocus) {
            fetch(EventTrigger.Focus);
        }
    }

    function fetch(trigger: EventTrigger) {
        if (input.value.length >= minLen || trigger === EventTrigger.Focus) {
            clearDebounceTimer();
            debounceTimer = window.setTimeout(
                () => startFetch(input.value, trigger, input.selectionStart || 0),
                trigger === EventTrigger.Keyboard || trigger === EventTrigger.Mouse ? debounceWaitMs : 0);
        } else {
            clear();
        }
    }

    function startFetch(inputText: string, trigger: EventTrigger, cursorPos: number) {
        if (destroyed) return;
        const savedFetchCounter = ++fetchCounter;
        settings.fetch(inputText, function (elements: T[] | false): void {
            if (fetchCounter === savedFetchCounter && elements) {
                items = elements;
                inputValue = inputText;
                selected = (items.length < 1 || disableAutoSelect) ? undefined : items[0];
                update();
            }
        }, trigger, cursorPos);
    }

    function keyupEventHandler(e: KeyboardEvent) {
        if (settings.keyup) {
            settings.keyup({
                event: e,
                fetch: () => fetch(EventTrigger.Keyboard)
            });
            return;
        }

        if (!containerDisplayed() && e.key === 'ArrowDown') {
            fetch(EventTrigger.Keyboard);
        }
    }

    function clickEventHandler(e: MouseEvent) {
        settings.click && settings.click({
            event: e,
            fetch: () => fetch(EventTrigger.Mouse)
        });
    }

    function blurEventHandler() {
        // when an item is selected by mouse click, the blur event will be initiated before the click event and remove DOM elements,
        // so that the click event will never be triggered. In order to avoid this issue, DOM removal should be delayed.
        setTimeout(() => {
            if (doc.activeElement !== input) {
                clear();
            }
        }, 200);
    }

    function manualFetch() {
        startFetch(input.value, EventTrigger.Manual, input.selectionStart || 0);
    }

    /**
     * Fixes #26: on long clicks focus will be lost and onSelect method will not be called
     */
    container.addEventListener('mousedown', function (evt: Event) {
        evt.stopPropagation();
        evt.preventDefault();
    });

    /**
     * Fixes #30: autocomplete closes when scrollbar is clicked in IE
     * See: https://stackoverflow.com/a/9210267/13172349
     */
    container.addEventListener('focus', () => input.focus());

    /**
     * This function will remove DOM elements and clear event handlers
     */
    function destroy() {
        input.removeEventListener('focus', focusEventHandler);
        input.removeEventListener('keyup', keyupEventHandler as EventListenerOrEventListenerObject)
        input.removeEventListener('click', clickEventHandler as EventListenerOrEventListenerObject)
        input.removeEventListener('keydown', keydownEventHandler as EventListenerOrEventListenerObject);
        input.removeEventListener('input', inputEventHandler as EventListenerOrEventListenerObject);
        input.removeEventListener('blur', blurEventHandler);
        window.removeEventListener('resize', resizeEventHandler);
        doc.removeEventListener('scroll', scrollEventHandler, true);
        input.removeAttribute('role');
        input.removeAttribute('aria-expanded');
        input.removeAttribute('aria-autocomplete');
        input.removeAttribute('aria-controls');
        input.removeAttribute('aria-activedescendant');
        input.removeAttribute('aria-owns');
        input.removeAttribute('aria-haspopup');
        clearDebounceTimer();
        clear();
        destroyed = true;
    }

    // setup event handlers
    input.addEventListener('keyup', keyupEventHandler as EventListenerOrEventListenerObject);
    input.addEventListener('click', clickEventHandler as EventListenerOrEventListenerObject);
    input.addEventListener('keydown', keydownEventHandler as EventListenerOrEventListenerObject);
    input.addEventListener('input', inputEventHandler as EventListenerOrEventListenerObject);
    input.addEventListener('blur', blurEventHandler);
    input.addEventListener('focus', focusEventHandler);
    window.addEventListener('resize', resizeEventHandler);
    doc.addEventListener('scroll', scrollEventHandler, true);

    return {
        destroy,
        fetch: manualFetch
    };
}

 /*
  * https://github.com/kraaden/autocomplete
  * Copyright (c) 2016 Denys Krasnoshchok
  * MIT License
  */

export interface AutocompleteItem {
    label?: string;
    group?: string;
}

export interface AutocompleteSettings<T extends AutocompleteItem> {
    input: HTMLInputElement;
    render?: (item: T, currentValue: string) => HTMLDivElement | undefined;
    renderGroup?: (name: string, currentValue: string) => HTMLDivElement | undefined;
    className?: string;
    minLength?: number;
    emptyMsg?: string;
    onSelect: (item: T, input: HTMLInputElement) => void;
    fetch: (text: string, update: (items: T[] | false) => void) => void;
    debounceWaitMs?: number;
}

export interface AutocompleteResult {
    destroy: () => void;
}

const enum Keys {
    Enter = 13,
    Esc = 27,
    Up = 38,
    Down = 40,
    Left = 37,
    Right = 39,
    Shift = 16,
    Ctrl = 17,
    Alt = 18,
    CapsLock = 20,
    WindowsKey = 91,
    Tab = 9
}

export default function autocomplete<T extends AutocompleteItem>(settings: AutocompleteSettings<T>): AutocompleteResult {

    // just an alias to minimize JS file size
    const doc = document;

    const container: HTMLDivElement = doc.createElement("div");
    const containerStyle = container.style;
    const userAgent = navigator.userAgent;
    const mobileFirefox = userAgent.indexOf("Firefox") !== -1 && userAgent.indexOf("Mobile") !== -1;
    const debounceWaitMs = settings.debounceWaitMs || 0;
    
    // 'keyup' event will not be fired on Mobile Firefox, so we have to use 'input' event instead
    const keyUpEventName = mobileFirefox ? "input" : "keyup";
    
    let items: T[] = [];
    let inputValue = "";
    const minLen = settings.minLength || 2;
    let selected: T | undefined;
    let keypressCounter = 0;
    let debounceTimer : number | undefined;

    if (!settings.input) {
        throw new Error("input undefined");
    }

    const input: HTMLInputElement = settings.input;

    container.className = "autocomplete " + (settings.className || "");
    containerStyle.position = "fixed";

    /**
     * Detach the container from DOM
     */
    function detach(): void {
        const parent = container.parentNode;
        if (parent) {
            parent.removeChild(container);
        }
    }

    /**
     * Clear debouncing timer if assigned
     */
    function clearDebounceTimer(): void {
        if (debounceTimer) {
            window.clearTimeout(debounceTimer);
        }
    }

    /**
     * Attach the container to DOM
     */
    function attach(): void {
        if (!container.parentNode) {
            doc.body.appendChild(container);
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

    function clear(): void {
        keypressCounter++;
        items = [];
        inputValue = "";
        selected = undefined;
        detach();
    }

    /**
     * Update autocomplete position
     */
    function updatePosition(): void {
        if (!containerDisplayed()) {
            return;
        }

        containerStyle.height = "auto";
        containerStyle.width = input.offsetWidth + "px";

        const inputRect = input.getBoundingClientRect();
        const top = inputRect.top + input.offsetHeight;
        const left = inputRect.left;

        containerStyle.top = top + "px";
        containerStyle.left = left + "px";
        containerStyle.maxHeight = (window.innerHeight - top) + "px";
    }

    /**
     * Redraw the autocomplete div element with suggestions
     */

    function update(): void {
        
        // delete all children from autocomplete DOM container
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        // function for rendering autocomplete suggestions
        let render = function(item: T, currentValue: string): HTMLDivElement | undefined {
            const itemElement = doc.createElement("div");
            itemElement.textContent = item.label || "";
            return itemElement;
        };
        if (settings.render) {
            render = settings.render;
        }

        // function to render autocomplete groups
        let renderGroup = function(groupName: string, currentValue: string): HTMLDivElement | undefined {
            const groupDiv = doc.createElement("div");
            groupDiv.textContent = groupName;
            return groupDiv;
        };
        if (settings.renderGroup) {
            renderGroup = settings.renderGroup;
        }

        const fragment = doc.createDocumentFragment();
        let prevGroup = "#9?$";

        items.forEach(function(item: T): void {
            if (item.group && item.group !== prevGroup) {
                prevGroup = item.group;
                const groupDiv = renderGroup(item.group, inputValue);
                if (groupDiv) {
                    groupDiv.className += " group";
                    fragment.appendChild(groupDiv);
                }
            }
            const div = render(item, inputValue);
            if (div) {
                div.addEventListener("click", function(ev: MouseEvent): void {
                    settings.onSelect(item, input);
                    clear();
                    ev.preventDefault();
                    ev.stopPropagation();
                });
                if (item === selected) {
                    div.className += " selected";
                }
                fragment.appendChild(div);
            }
        });
        container.appendChild(fragment);
        if (items.length < 1) {
            if (settings.emptyMsg) {
                const empty = doc.createElement("div");
                empty.className = "empty";
                empty.textContent = settings.emptyMsg;
                container.appendChild(empty);
            } else {
                clear();
                return;
            }
        }

        attach();
        updatePosition();

        updateScroll();
    }

    function updateIfDisplayed(): void {
        if (containerDisplayed()) {
            update();
        }
    }

    function resizeEventHandler(): void {
        updateIfDisplayed();
    }

    function scrollEventHandler(e: Event): void {
        if (e.target !== container) {
            updateIfDisplayed();
        } else {
            e.preventDefault();
        }
    }

    /**
     * Event handler for keyup event
     */

    function keyup(ev: KeyboardEvent): void {
        const keyCode = ev.which || ev.keyCode || 0;

        const ignore = [Keys.Up, Keys.Enter, Keys.Esc, Keys.Right, Keys.Left, Keys.Shift, Keys.Ctrl, Keys.Alt, Keys.CapsLock, Keys.WindowsKey, Keys.Tab];
        for (const key of ignore) {
            if (keyCode === key) {
                return;
            }
        }

        // the down key is used to open autocomplete
        if (keyCode === Keys.Down && containerDisplayed()) {
            return;
        }

        // if multiple keys were pressed, before we get update from server,
        // this may cause redrawing our autocomplete multiple times after the last key press.
        // to avoid this, the number of times keyboard was pressed will be
        // saved and checked before redraw our autocomplete box.
        const savedKeypressCounter = ++keypressCounter;

        const val = input.value;

        if (val.length >= minLen) {
            clearDebounceTimer();
            debounceTimer = window.setTimeout(function(): void {
                settings.fetch(val, function(elements: T[] | false): void {
                    if (keypressCounter === savedKeypressCounter && elements) {
                        items = elements;
                        inputValue = val;
                        selected = items.length > 0 ? items[0] : undefined;
                        update();
                    }
                });
            }, debounceWaitMs);
        } else {
            clear();
        }
    }

    /**
     * Automatically move scroll bar if selected item is not visible
     */

    function updateScroll(): void {
        const elements = container.getElementsByClassName("selected");
        if (elements.length > 0) {
            let element = elements[0] as HTMLDivElement;
            
            // make group visible
            const previous = element.previousElementSibling as HTMLDivElement;
            if (previous && previous.className.indexOf("group") !== -1 && !previous.previousElementSibling) {
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

    /**
     * Select the previous item in suggestions
     */

    function selectPrev(): void {
        if (items.length < 1) {
            selected = undefined;
        } else {
            if (selected === items[0]) {
                selected = items[items.length - 1];
            } else {
                for (let i = items.length - 1; i > 0; i--) {
                    if (selected === items[i] || i === 1) {
                        selected = items[i - 1];
                        break;
                    }
                }
            }
        }
    }

    /**
     * Select the next item in suggestions
     */

    function selectNext(): void {
        if (items.length < 1) {
            selected = undefined;
        }
        if (!selected || selected === items[items.length - 1]) {
            selected = items[0];
            return;
        }
        for (let i = 0; i < (items.length - 1); i++) {
            if (selected === items[i]) {
                selected = items[i + 1];
                break;
            }
        }
    }

    /**
     * keydown keyboard event handler
     */

    function keydown(ev: KeyboardEvent): void {
        const keyCode = ev.which || ev.keyCode || 0;

        if (keyCode === Keys.Up || keyCode === Keys.Down || keyCode === Keys.Esc) {
            const containerIsDisplayed = containerDisplayed();

            if (keyCode === Keys.Esc) {
                clear();
            } else {
                if (!containerDisplayed || items.length < 1) {
                    return;
                }
                keyCode === Keys.Up
                    ? selectPrev()
                    : selectNext();
                update();
            }

            ev.preventDefault();
            if (containerIsDisplayed) {
                ev.stopPropagation();
            }

            return;
        }

        if (keyCode === Keys.Enter && selected) {
            settings.onSelect(selected, input);
            clear();
        }
    }

    /**
     * Blur keyboard event handler
     */

    function blur(): void {
        // we need to delay clear, because when we click on an item, blur will be called before click and remove items from DOM
        setTimeout(() => {
            if (doc.activeElement !== input) {
                clear();
            }
        }, 200);
    }

    /**
     * This function will remove DOM elements and clear event handlers
     */

    function destroy(): void {
        input.removeEventListener("keydown", keydown);
        input.removeEventListener(keyUpEventName, keyup as EventListenerOrEventListenerObject);
        input.removeEventListener("blur", blur);
        window.removeEventListener("resize", resizeEventHandler);
        doc.removeEventListener("scroll", scrollEventHandler, true);
        clearDebounceTimer();
        clear();

        // prevent the update call if there are pending AJAX requests
        keypressCounter++;
    }

    // setup event handlers
    input.addEventListener("keydown", keydown);
    input.addEventListener(keyUpEventName, keyup as EventListenerOrEventListenerObject);
    input.addEventListener("blur", blur);
    window.addEventListener("resize", resizeEventHandler);
    doc.addEventListener("scroll", scrollEventHandler, true);

    return {
        destroy
    };
}

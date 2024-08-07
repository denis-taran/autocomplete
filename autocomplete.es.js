/**
 * Copyright (c) 2016 Denis Taran
 *
 * Homepage: https://smartscheduling.com/en/documentation/autocomplete
 * Source: https://github.com/denis-taran/autocomplete
 *
 * MIT License
 */
function autocomplete(settings) {
    // just an alias to minimize JS file size
    var doc = document;
    var container = settings.container || doc.createElement('div');
    var preventSubmit = settings.preventSubmit || 0 /* Never */;
    container.id = container.id || 'autocomplete-' + uid();
    var containerStyle = container.style;
    var debounceWaitMs = settings.debounceWaitMs || 0;
    var disableAutoSelect = settings.disableAutoSelect || false;
    var customContainerParent = container.parentElement;
    var items = [];
    var inputValue = '';
    var minLen = 2;
    var showOnFocus = settings.showOnFocus;
    var selected;
    var fetchCounter = 0;
    var debounceTimer;
    var destroyed = false;
    // Fixes #104: autocomplete selection is broken on Firefox for Android
    var suppressAutocomplete = false;
    if (settings.minLength !== undefined) {
        minLen = settings.minLength;
    }
    if (!settings.input) {
        throw new Error('input undefined');
    }
    var input = settings.input;
    container.className = [container.className, 'autocomplete', settings.className || ''].join(' ').trim();
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
    function uid() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }
    /**
     * Detach the container from DOM
     */
    function detach() {
        var parent = container.parentNode;
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
    function containerDisplayed() {
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
        var maxHeight = 0;
        var inputRect;
        function calc() {
            var docEl = doc.documentElement;
            var clientTop = docEl.clientTop || doc.body.clientTop || 0;
            var clientLeft = docEl.clientLeft || doc.body.clientLeft || 0;
            var scrollTop = window.pageYOffset || docEl.scrollTop;
            var scrollLeft = window.pageXOffset || docEl.scrollLeft;
            inputRect = input.getBoundingClientRect();
            var top = inputRect.top + input.offsetHeight + scrollTop - clientTop;
            var left = inputRect.left + scrollLeft - clientLeft;
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
        container.textContent = '';
        input.setAttribute('aria-activedescendant', '');
        // function for rendering autocomplete suggestions
        var render = function (item, _, __) {
            var itemElement = doc.createElement('div');
            itemElement.textContent = item.label || '';
            return itemElement;
        };
        if (settings.render) {
            render = settings.render;
        }
        // function to render autocomplete groups
        var renderGroup = function (groupName, _) {
            var groupDiv = doc.createElement('div');
            groupDiv.textContent = groupName;
            return groupDiv;
        };
        if (settings.renderGroup) {
            renderGroup = settings.renderGroup;
        }
        var fragment = doc.createDocumentFragment();
        var prevGroup = uid();
        items.forEach(function (item, index) {
            if (item.group && item.group !== prevGroup) {
                prevGroup = item.group;
                var groupDiv = renderGroup(item.group, inputValue);
                if (groupDiv) {
                    groupDiv.className += ' group';
                    fragment.appendChild(groupDiv);
                }
            }
            var div = render(item, inputValue, index);
            if (div) {
                div.id = container.id + "_" + index;
                div.setAttribute('role', 'option');
                div.addEventListener('click', function (ev) {
                    suppressAutocomplete = true;
                    try {
                        settings.onSelect(item, input);
                    }
                    finally {
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
                var empty = doc.createElement('div');
                empty.id = container.id + "_" + uid();
                empty.className = 'empty';
                empty.textContent = settings.emptyMsg;
                container.appendChild(empty);
                input.setAttribute('aria-activedescendant', empty.id);
            }
            else {
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
    function scrollEventHandler(e) {
        if (e.target !== container) {
            updateIfDisplayed();
        }
        else {
            e.preventDefault();
        }
    }
    function inputEventHandler() {
        if (!suppressAutocomplete) {
            fetch(0 /* Keyboard */);
        }
    }
    /**
     * Automatically move scroll bar if selected item is not visible
     */
    function updateScroll() {
        var elements = container.getElementsByClassName('selected');
        if (elements.length > 0) {
            var element = elements[0];
            // make group visible
            var previous = element.previousElementSibling;
            if (previous && previous.className.indexOf('group') !== -1 && !previous.previousElementSibling) {
                element = previous;
            }
            if (element.offsetTop < container.scrollTop) {
                container.scrollTop = element.offsetTop;
            }
            else {
                var selectBottom = element.offsetTop + element.offsetHeight;
                var containerBottom = container.scrollTop + container.offsetHeight;
                if (selectBottom > containerBottom) {
                    container.scrollTop += selectBottom - containerBottom;
                }
            }
        }
    }
    function selectPreviousSuggestion() {
        var index = items.indexOf(selected);
        selected = index === -1
            ? undefined
            : items[(index + items.length - 1) % items.length];
        updateSelectedSuggestion(index);
    }
    function selectNextSuggestion() {
        var index = items.indexOf(selected);
        selected = items.length < 1
            ? undefined
            : index === -1
                ? items[0]
                : items[(index + 1) % items.length];
        updateSelectedSuggestion(index);
    }
    function updateSelectedSuggestion(index) {
        if (items.length > 0) {
            unselectSuggestion(index);
            selectSuggestion(items.indexOf(selected));
            updateScroll();
        }
    }
    function selectSuggestion(index) {
        var element = doc.getElementById(container.id + "_" + index);
        if (element) {
            element.classList.add('selected');
            element.setAttribute('aria-selected', 'true');
            input.setAttribute('aria-activedescendant', element.id);
        }
    }
    function unselectSuggestion(index) {
        var element = doc.getElementById(container.id + "_" + index);
        if (element) {
            element.classList.remove('selected');
            element.removeAttribute('aria-selected');
            input.removeAttribute('aria-activedescendant');
        }
    }
    function handleArrowAndEscapeKeys(ev, key) {
        var containerIsDisplayed = containerDisplayed();
        if (key === 'Escape') {
            clear();
        }
        else {
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
    function handleEnterKey(ev) {
        if (selected) {
            if (preventSubmit === 2 /* OnSelect */) {
                ev.preventDefault();
            }
            suppressAutocomplete = true;
            try {
                settings.onSelect(selected, input);
            }
            finally {
                suppressAutocomplete = false;
            }
            clear();
        }
        if (preventSubmit === 1 /* Always */) {
            ev.preventDefault();
        }
    }
    function keydownEventHandler(ev) {
        var key = ev.key;
        switch (key) {
            case 'ArrowUp':
            case 'ArrowDown':
            case 'Escape':
                handleArrowAndEscapeKeys(ev, key);
                break;
            case 'Enter':
                handleEnterKey(ev);
                break;
        }
    }
    function focusEventHandler() {
        if (showOnFocus) {
            fetch(1 /* Focus */);
        }
    }
    function fetch(trigger) {
        if (input.value.length >= minLen || trigger === 1 /* Focus */) {
            clearDebounceTimer();
            debounceTimer = window.setTimeout(function () { return startFetch(input.value, trigger, input.selectionStart || 0); }, trigger === 0 /* Keyboard */ || trigger === 2 /* Mouse */ ? debounceWaitMs : 0);
        }
        else {
            clear();
        }
    }
    function startFetch(inputText, trigger, cursorPos) {
        if (destroyed)
            return;
        var savedFetchCounter = ++fetchCounter;
        settings.fetch(inputText, function (elements) {
            if (fetchCounter === savedFetchCounter && elements) {
                items = elements;
                inputValue = inputText;
                selected = (items.length < 1 || disableAutoSelect) ? undefined : items[0];
                update();
            }
        }, trigger, cursorPos);
    }
    function keyupEventHandler(e) {
        if (settings.keyup) {
            settings.keyup({
                event: e,
                fetch: function () { return fetch(0 /* Keyboard */); }
            });
            return;
        }
        if (!containerDisplayed() && e.key === 'ArrowDown') {
            fetch(0 /* Keyboard */);
        }
    }
    function clickEventHandler(e) {
        settings.click && settings.click({
            event: e,
            fetch: function () { return fetch(2 /* Mouse */); }
        });
    }
    function blurEventHandler() {
        // when an item is selected by mouse click, the blur event will be initiated before the click event and remove DOM elements,
        // so that the click event will never be triggered. In order to avoid this issue, DOM removal should be delayed.
        setTimeout(function () {
            if (doc.activeElement !== input) {
                clear();
            }
        }, 200);
    }
    function manualFetch() {
        startFetch(input.value, 3 /* Manual */, input.selectionStart || 0);
    }
    /**
     * Fixes #26: on long clicks focus will be lost and onSelect method will not be called
     */
    container.addEventListener('mousedown', function (evt) {
        evt.stopPropagation();
        evt.preventDefault();
    });
    /**
     * Fixes #30: autocomplete closes when scrollbar is clicked in IE
     * See: https://stackoverflow.com/a/9210267/13172349
     */
    container.addEventListener('focus', function () { return input.focus(); });
    // If the custom autocomplete container is already appended to the DOM during widget initialization, detach it.
    detach();
    /**
     * This function will remove DOM elements and clear event handlers
     */
    function destroy() {
        input.removeEventListener('focus', focusEventHandler);
        input.removeEventListener('keyup', keyupEventHandler);
        input.removeEventListener('click', clickEventHandler);
        input.removeEventListener('keydown', keydownEventHandler);
        input.removeEventListener('input', inputEventHandler);
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
    input.addEventListener('keyup', keyupEventHandler);
    input.addEventListener('click', clickEventHandler);
    input.addEventListener('keydown', keydownEventHandler);
    input.addEventListener('input', inputEventHandler);
    input.addEventListener('blur', blurEventHandler);
    input.addEventListener('focus', focusEventHandler);
    window.addEventListener('resize', resizeEventHandler);
    doc.addEventListener('scroll', scrollEventHandler, true);
    return {
        destroy: destroy,
        fetch: manualFetch
    };
}

export default autocomplete;
//# sourceMappingURL=autocomplete.es.js.map

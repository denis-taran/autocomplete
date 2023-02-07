(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.autocomplete = factory());
}(this, (function () { 'use strict';

    /*
     * https://github.com/kraaden/autocomplete
     * Copyright (c) 2016 Denys Krasnoshchok
     * MIT License
     */
    function autocomplete(settings) {
        // just an alias to minimize JS file size
        var doc = document;
        var container = settings.container || doc.createElement('div');
        container.id = container.id || 'autocomplete-' + uid();
        var containerStyle = container.style;
        var debounceWaitMs = settings.debounceWaitMs || 0;
        var preventSubmit = settings.preventSubmit || false;
        var disableAutoSelect = settings.disableAutoSelect || false;
        var items = [];
        var inputValue = '';
        var minLen = 2;
        var showOnFocus = settings.showOnFocus;
        var selected;
        var fetchCounter = 0;
        var debounceTimer;
        if (settings.minLength !== undefined) {
            minLen = settings.minLength;
        }
        if (!settings.input) {
            throw new Error('input undefined');
        }
        var input = settings.input;
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
                doc.body.appendChild(container);
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
            container.innerHTML = '';
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
                        settings.onSelect(item, input);
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
            startFetch(0 /* Keyboard */);
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
        /**
         * Select the previous item in suggestions
         */
        function selectPrev() {
            var index = items.indexOf(selected);
            selected = index === -1
                ? undefined
                : items[(index + items.length - 1) % items.length];
        }
        /**
         * Select the next item in suggestions
         */
        function selectNext() {
            var index = items.indexOf(selected);
            selected = items.length < 1
                ? undefined
                : index === -1
                    ? items[0]
                    : items[(index + 1) % items.length];
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
                    ? selectPrev()
                    : selectNext();
                update();
            }
            ev.preventDefault();
            if (containerIsDisplayed) {
                ev.stopPropagation();
            }
        }
        function handleEnterKey(ev) {
            if (selected) {
                settings.onSelect(selected, input);
                clear();
            }
            if (preventSubmit) {
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
                startFetch(1 /* Focus */);
            }
        }
        function startFetch(trigger) {
            // If multiple keys were pressed before suggestions received from server, the autocomplete will
            // be redrawed multiple times, causing 'blinking'. To avoid this, the number of times fetch was
            // called will be saved and checked before redraw, so only one redraw occurs.
            var savedFetchCounter = ++fetchCounter;
            var inputText = input.value;
            var cursorPos = input.selectionStart || 0;
            if (inputText.length >= minLen || trigger === 1 /* Focus */) {
                clearDebounceTimer();
                debounceTimer = window.setTimeout(function () {
                    settings.fetch(inputText, function (elements) {
                        if (fetchCounter === savedFetchCounter && elements) {
                            items = elements;
                            inputValue = inputText;
                            selected = (items.length < 1 || disableAutoSelect) ? undefined : items[0];
                            update();
                        }
                    }, trigger, cursorPos);
                }, trigger === 0 /* Keyboard */ || trigger === 2 /* Mouse */ ? debounceWaitMs : 0);
            }
            else {
                clear();
            }
        }
        function keyupEventHandler(e) {
            if (settings.keyup) {
                settings.keyup({
                    event: e,
                    fetch: function () { return startFetch(0 /* Keyboard */); }
                });
                return;
            }
            if (!containerDisplayed() && e.key === 'ArrowDown') {
                startFetch(0 /* Keyboard */);
            }
        }
        function clickEventHandler(e) {
            settings.click && settings.click({
                event: e,
                fetch: function () { return startFetch(2 /* Mouse */); }
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
            destroy: destroy
        };
    }

    return autocomplete;

})));
//# sourceMappingURL=autocomplete.js.map

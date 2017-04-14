(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        var f = factory();
        Object.defineProperty(exports, '__esModule', { value: true });
        exports.autocomplete = f;
        exports.default = f;
    } else {
        window['autocomplete'] = factory();
    }
})(function () {
    "use strict";
    function autocomplete(settings) {
        // just an alias to minimize JS file size
        var doc = document;
        var input;
        var container = doc.createElement("div");
        var containerStyle = container.style;
        var items = [];
        var minLen = settings.minLength || 2;
        var selected;
        var keypressCounter = 0;
        if (!settings.input) {
            throw "input undefined";
        }
        input = settings.input;
        doc.body.appendChild(container);
        container.className = "autocomplete " + (settings.className || "");
        containerStyle.position = "absolute";
        /**
         * Check if container is displayed
         */
        function containerDisplayed() {
            return containerStyle.display !== "none";
        }
        /**
         * Clear autocomplete state and hide container
         */
        function clear() {
            keypressCounter++;
            items = [];
            selected = undefined;
            containerStyle.display = "none";
        }
        /**
         * Redraw the autocomplete div element with suggestions
         */
        function update() {
            // delete all children from autocomplete DOM container
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
            // check if groups are specified
            var grouping = false;
            var prevGroup = "#9?$";
            items.forEach(function (item) { if (item.group) {
                grouping = true;
            } });
            // function for rendering autocomplete suggestions
            var render = function (item) {
                var itemElement = doc.createElement("div");
                itemElement.textContent = item.label;
                return itemElement;
            };
            if (settings.render) {
                render = settings.render;
            }
            // function to render autocomplete groups
            var renderGroup = function (groupName) {
                var groupDiv = doc.createElement("div");
                groupDiv.textContent = groupName;
                return groupDiv;
            };
            if (settings.renderGroup) {
                renderGroup = settings.renderGroup;
            }
            items.forEach(function (item) {
                if (item.group && item.group !== prevGroup) {
                    prevGroup = item.group;
                    var groupDiv = renderGroup(item.group);
                    if (groupDiv) {
                        groupDiv.className += " group";
                        container.appendChild(groupDiv);
                    }
                }
                var div = render(item);
                if (div) {
                    div.addEventListener("click", function (ev) {
                        settings.onSelect(item.item, input);
                        clear();
                        ev.preventDefault();
                        ev.stopPropagation();
                    });
                    if (item === selected) {
                        div.className += " selected";
                    }
                    container.appendChild(div);
                }
            });
            if (items.length < 1) {
                if (settings.emptyMsg) {
                    var empty = doc.createElement("div");
                    empty.className = "empty";
                    empty.textContent = settings.emptyMsg;
                    container.appendChild(empty);
                }
                else {
                    clear();
                    return;
                }
            }
            var inputRect = input.getBoundingClientRect();
            var top = inputRect.top + input.offsetHeight + doc.body.scrollTop;
            containerStyle.top = top + "px";
            containerStyle.left = inputRect.left + "px";
            containerStyle.width = input.offsetWidth + "px";
            containerStyle.maxHeight = (window.innerHeight - (inputRect.top + input.offsetHeight)) + "px";
            containerStyle.height = "auto";
            containerStyle.display = "block";
            updateScroll();
        }
        /**
         * Event handler for both keyup and focus events
         */
        function keyupOrFocus(ev) {
            var keyCode = ev.which || ev.keyCode || 0;
            // if multiple keys were pressed, before we get update from server,
            // this may cause redrawing our autocomplete multiple times after the last key press.
            // to avoid this, the number of times keyboard was pressed will be
            // saved and checked before redraw our autocomplete box.
            var savedKeypressCounter = ++keypressCounter;
            if (keyCode === 38 /* Up */ || keyCode === 13 /* Enter */ || keyCode === 27 /* Esc */ || keyCode === 39 /* Right */ || keyCode === 37 /* Left */ || keyCode === 0) {
                return;
            }
            // the down key is used to open autocomplete
            if (keyCode === 40 /* Down */ && containerDisplayed()) {
                return;
            }
            if (input.value.length >= minLen) {
                settings.fetch(input.value, function (elements) {
                    if (keypressCounter === savedKeypressCounter && elements) {
                        items = elements;
                        selected = items.length > 0 ? items[0] : undefined;
                        update();
                    }
                });
            }
            else {
                clear();
            }
        }
        /**
         * Automatically move scroll bar if selected item is not visible
         */
        function updateScroll() {
            var elements = container.getElementsByClassName("selected");
            if (elements.length > 0) {
                var element = elements[0];
                // make group visible
                var previous = element.previousElementSibling;
                if (previous && previous.className.indexOf("group") !== -1 && !previous.previousElementSibling) {
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
            if (items.length < 1) {
                selected = undefined;
            }
            else {
                if (selected === items[0]) {
                    selected = items[items.length - 1];
                }
                else {
                    for (var i = items.length - 1; i > 0; i--) {
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
        function selectNext() {
            if (items.length < 1) {
                selected = undefined;
            }
            if (!selected || selected === items[items.length - 1]) {
                selected = items[0];
                return;
            }
            for (var i = 0; i < (items.length - 1); i++) {
                if (selected === items[i]) {
                    selected = items[i + 1];
                    break;
                }
            }
        }
        /**
         * keydown keyboard event handler
         */
        function keydown(ev) {
            var keyCode = ev.which || ev.keyCode || 0;
            if (keyCode === 38 /* Up */ || keyCode === 40 /* Down */ || keyCode === 27 /* Esc */) {
                var containerIsDisplayed = containerDisplayed();
                if (keyCode === 27 /* Esc */) {
                    clear();
                }
                else {
                    if (!containerDisplayed || items.length < 1) {
                        return;
                    }
                    keyCode === 38 /* Up */
                        ? selectPrev()
                        : selectNext();
                    console.log("ins. keydown length:" + items.length);
                    update();
                }
                ev.preventDefault();
                if (containerIsDisplayed) {
                    ev.stopPropagation();
                }
                return;
            }
            if (keyCode === 13 /* Enter */ && selected) {
                settings.onSelect(selected.item, input);
                clear();
            }
        }
        /**
         * Blur keyboard event handler
         */
        function blur() {
            // we need to delay clear, because when we click on an item, blur will be called before click and remove items from DOM
            setTimeout(function () {
                if (doc.activeElement !== input) {
                    clear();
                }
            }, 200);
        }
        /**
         * This function will remove DOM elements and clear event handlers
         */
        function destroy() {
            input.removeEventListener("keydown", keydown);
            input.removeEventListener("keyup", keyupOrFocus);
            input.removeEventListener("focus", keyupOrFocus);
            input.removeEventListener("blur", blur);
            window.removeEventListener("resize", update);
            clear();
            // remove container from DOM
            var parent = container.parentNode;
            if (parent) {
                parent.removeChild(container);
            }
        }
        // setup event handlers
        input.addEventListener("keydown", keydown);
        input.addEventListener("keyup", keyupOrFocus);
        input.addEventListener("focus", keyupOrFocus);
        input.addEventListener("blur", blur);
        window.addEventListener("resize", update);
        return {
            destroy: destroy
        };
    }
    return autocomplete;
    
    
});

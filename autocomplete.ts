 /*
  * https://github.com/kraaden/web-autocomplete
  * Copyright (c) 2016 Denys Krasnoshchok
  * MIT License
  */

export interface AutocompleteItem<T> {
    label: string;
    item: T;
    group?: string;
}

export interface AutocompleteSettings<T> {
    input: HTMLInputElement;
    render?: (item: AutocompleteItem<T>) => HTMLDivElement | undefined;
    renderGroup?: (name: string) => HTMLDivElement | undefined;
    className?: string;
    minLength?: number;
    emptyMsg?: string;
    itemSelected: (item: T, input: HTMLInputElement) => void;
    fetch: (text: string, update: (items: Array<AutocompleteItem<T>>) => void) => void;
}

export interface AutocompleteResult {
    destroy: () => void;
}

const enum Keys {
    Enter = 13,
    Esc = 27,
    Up = 38,
    Down = 40
}

export function autocomplete<T>(settings: AutocompleteSettings<T>): AutocompleteResult {

    // just an alias to minimize JS file size
    let doc = document;

    let input: HTMLInputElement;
    let container: HTMLDivElement = doc.createElement("div");
    let containerStyle = container.style;
    let items: Array<AutocompleteItem<T>> = [];
    let minLen = settings.minLength || 2;
    let selected: AutocompleteItem<T> | undefined;
    let keypressCounter = 0;
    let prevValue: string;

    if (!settings.input) {
        throw "input undefined";
    }

    input = settings.input;
    prevValue = input.value;

    doc.body.appendChild(container);
    container.className = "autocomplete " + (settings.className || "");
    containerStyle.position = "absolute";

    /**
     * Clear autocomplete state and hide container
     */

    function clear(): void {
        keypressCounter++;
        items = [];
        selected = undefined;
        containerStyle.display = "none";
    }

    /**
     * Redraw the autocomplete div element with suggestions
     */

    function update(): void {
        
        // delete all children from autocomplete DOM container
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }

        // check if groups are specified
        let grouping = false;
        let prevGroup = "#9?$";
        items.forEach(function(item: AutocompleteItem<T>): void { if (item.group) { grouping = true; }});

        // function for rendering autocomplete suggestions
        let render = function(item: AutocompleteItem<T>): HTMLDivElement | undefined {
            let itemElement = doc.createElement("div");
            itemElement.textContent = item.label;
            return itemElement;
        };
        if (settings.render) {
            render = settings.render;
        }

        // function to render autocomplete groups
        let renderGroup = function(groupName: string): HTMLDivElement | undefined {
            let groupDiv = doc.createElement("div");
            groupDiv.textContent = groupName;
            return groupDiv;
        };
        if (settings.renderGroup) {
            renderGroup = settings.renderGroup;
        }

        items.forEach(function(item: AutocompleteItem<T>): void {
            if (item.group && item.group !== prevGroup) {
                prevGroup = item.group;
                let groupDiv = renderGroup(item.group);
                if (groupDiv) {
                    groupDiv.className += " group";
                    container.appendChild(groupDiv);
                }
            }
            let div = render(item);
            if (div) {
                div.addEventListener("click", function(ev: MouseEvent): void {
                    settings.itemSelected(item.item, input);
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
        if (settings.emptyMsg && items.length < 1) {
            let empty = doc.createElement("div");
            empty.className = "empty";
            empty.textContent = settings.emptyMsg;
            container.appendChild(empty);
        }
        let inputRect = input.getBoundingClientRect();
        let top = inputRect.top + input.offsetHeight;
        
        containerStyle.top = top + "px";
        containerStyle.left = inputRect.left + "px";
        containerStyle.width = input.offsetWidth + "px";
        containerStyle.maxHeight = (window.innerHeight - top) + "px";
        containerStyle.height = "auto";
        containerStyle.display = "block";
        updateScroll();
    }

    /**
     * Event handler for both keyup and focus events
     */

    function keyupOrFocus(ev: KeyboardEvent): void {
        let keyCode = ev.which || ev.keyCode || 0;

        // if multiple keys were pressed, before we get update from server,
        // this may cause redrawing our autocomplete multiple times after the last key press.
        // to avoid this, the number of times keyboard was pressed will be
        // saved and checked before redraw our autocomplete box.
        let savedKeypressCounter = ++keypressCounter;

        if (keyCode === Keys.Up || keyCode === Keys.Down || keyCode === Keys.Enter) {
            return;
        }

        // esc
        if (keyCode === Keys.Esc) {
            clear();
            return;
        }

        if (input.value.length >= minLen) {
            if (input.value !== prevValue) {
                settings.fetch(input.value, function (elements: Array<AutocompleteItem<T>>): void {
                    if (keypressCounter === savedKeypressCounter && elements) {
                        items = elements;
                        selected = items.length > 0 ? items[0] : undefined;
                        update();
                    }
                });
            }
        } else {
            clear();
        }

        prevValue = input.value;
    }

    /**
     * Automatically move scroll bar if selected item is not visible
     */

    function updateScroll(): void {
        let elements = container.getElementsByClassName("selected");
        if (elements.length > 0) {
            let element = elements[0] as HTMLDivElement;
            
            // make group visible
            let previous = element.previousElementSibling as HTMLDivElement;
            if (previous && previous.className.indexOf("group") !== -1 && !previous.previousElementSibling) {
                element = previous;
            }

            if (element.offsetTop < container.scrollTop) {
                container.scrollTop = element.offsetTop;
            } else {
                let selectBottom = element.offsetTop + element.offsetHeight;
                let containerBottom = container.scrollTop + container.offsetHeight;
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
        let keyCode = ev.which || ev.keyCode || 0;

        if (keyCode === Keys.Up || keyCode === Keys.Down) {
            keyCode === Keys.Up
                ? selectPrev()
                : selectNext();
            update();
            ev.preventDefault();
            return;
        }

        if (keyCode === Keys.Enter && selected) {
            settings.itemSelected(selected.item, input);
            clear();
        }
    }

    /**
     * Blur keyboard event handler
     */

    function blur(): void {
        setTimeout(() => {
            if (doc.activeElement !== input) {
                clear();
            }
        }, 100);
    }

    /**
     * This function will remove DOM elements and clear event handlers
     */

    function destroy(): void {
        input.removeEventListener("keydown", keydown);
        input.removeEventListener("keyup", keyupOrFocus);
        input.removeEventListener("focus", keyupOrFocus);
        input.removeEventListener("blur", blur);
        clear();

        // remove container from DOM
        let parent = container.parentNode;
        if (parent) {
            parent.removeChild(container);
        }
    }

    // setup event handlers
    input.addEventListener("keydown", keydown);
    input.addEventListener("keyup", keyupOrFocus);
    input.addEventListener("focus", keyupOrFocus);
    input.addEventListener("blur", blur);

    return {
        destroy
    };
}

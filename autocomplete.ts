 /*
  * https://github.com/kraaden/autocomplete
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
    onSelect: (item: T, input: HTMLInputElement) => void;
    fetch: (text: string, update: (items: Array<AutocompleteItem<T>>) => void) => void;
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
    Right = 39
}

export function autocomplete<T>(settings: AutocompleteSettings<T>): AutocompleteResult {

    // just an alias to minimize JS file size
    const doc = document;

    let input: HTMLInputElement;
    const container: HTMLDivElement = doc.createElement("div");
    const containerStyle = container.style;
    let items: Array<AutocompleteItem<T>> = [];
    const minLen = settings.minLength || 2;
    let selected: AutocompleteItem<T> | undefined;
    let keypressCounter = 0;
    let unloaded: boolean;

    if (!settings.input) {
        throw new Error("input undefined");
    }

    input = settings.input;

    doc.body.appendChild(container);
    container.className = "autocomplete " + (settings.className || "");
    containerStyle.position = "absolute";
    containerStyle.display = "none";

    /**
     * Check if container for autocomplete is displayed
     */

    function containerDisplayed(): boolean {
        return containerStyle.display !== "none";
    }

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
            const itemElement = doc.createElement("div");
            itemElement.textContent = item.label;
            return itemElement;
        };
        if (settings.render) {
            render = settings.render;
        }

        // function to render autocomplete groups
        let renderGroup = function(groupName: string): HTMLDivElement | undefined {
            const groupDiv = doc.createElement("div");
            groupDiv.textContent = groupName;
            return groupDiv;
        };
        if (settings.renderGroup) {
            renderGroup = settings.renderGroup;
        }

        items.forEach(function(item: AutocompleteItem<T>): void {
            if (item.group && item.group !== prevGroup) {
                prevGroup = item.group;
                const groupDiv = renderGroup(item.group);
                if (groupDiv) {
                    groupDiv.className += " group";
                    container.appendChild(groupDiv);
                }
            }
            const div = render(item);
            if (div) {
                div.addEventListener("click", function(ev: MouseEvent): void {
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
                const empty = doc.createElement("div");
                empty.className = "empty";
                empty.textContent = settings.emptyMsg;
                container.appendChild(empty);
            } else {
                clear();
                return;
            }
        }
        const inputRect = input.getBoundingClientRect();
        const top = inputRect.top + input.offsetHeight + doc.body.scrollTop;
        
        containerStyle.top = top + "px";
        containerStyle.left = inputRect.left + "px";
        containerStyle.width = input.offsetWidth + "px";
        containerStyle.maxHeight = (window.innerHeight - (inputRect.top + input.offsetHeight)) + "px";
        containerStyle.height = "auto";
        containerStyle.display = "block";
        updateScroll();
    }

    /**
     * Event handler for keyup event
     */

    function keyup(ev: KeyboardEvent): void {
        const keyCode = ev.which || ev.keyCode || 0;

        // if multiple keys were pressed, before we get update from server,
        // this may cause redrawing our autocomplete multiple times after the last key press.
        // to avoid this, the number of times keyboard was pressed will be
        // saved and checked before redraw our autocomplete box.
        const savedKeypressCounter = ++keypressCounter;

        if (keyCode === Keys.Up || keyCode === Keys.Enter || keyCode === Keys.Esc || keyCode === Keys.Right || keyCode === Keys.Left) {
            return;
        }

        // the down key is used to open autocomplete
        if (keyCode === Keys.Down && containerDisplayed()) {
            return;
        }

        if (input.value.length >= minLen) {
            settings.fetch(input.value, function(elements: Array<AutocompleteItem<T>>): void {
                if (keypressCounter === savedKeypressCounter && elements && !unloaded) {
                    items = elements;
                    selected = items.length > 0 ? items[0] : undefined;
                    update();
                }
            });
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
            settings.onSelect(selected.item, input);
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
        unloaded = true;
        input.removeEventListener("keydown", keydown);
        input.removeEventListener("keyup", keyup);
        input.removeEventListener("blur", blur);
        window.removeEventListener("resize", update);
        clear();

        // remove container from DOM
        const parent = container.parentNode;
        if (parent) {
            parent.removeChild(container);
        }
    }

    // setup event handlers
    input.addEventListener("keydown", keydown);
    input.addEventListener("keyup", keyup);
    input.addEventListener("blur", blur);
    window.addEventListener("resize", update);

    return {
        destroy
    };
}

// tslint:disable-next-line:no-default-export
export default autocomplete;

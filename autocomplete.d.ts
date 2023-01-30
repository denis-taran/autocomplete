export declare const enum EventTrigger {
    Keyboard = 0,
    Focus = 1
}
export interface AutocompleteItem {
    label?: string;
    group?: string;
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
}
export interface AutocompleteResult {
    destroy: () => void;
}
export declare const enum Keys {
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
    Tab = 9,
    F1 = 112,
    F12 = 123
}
export default function autocomplete<T extends AutocompleteItem>(settings: AutocompleteSettings<T>): AutocompleteResult;

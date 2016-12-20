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
export declare function autocomplete<T>(settings: AutocompleteSettings<T>): AutocompleteResult;
export default autocomplete;

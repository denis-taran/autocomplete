
Blazing fast and lightweight autocomplete widget without dependencies. Only 1KB gzipped.

Demo: https://kraaden.github.io/autocomplete/

## Installation

If you want to use the library in browser, just include the `autocomplete.js` and `autocomplete.css` into your HTML file.

For `node.js`:

```console
npm install autocompleter
```

Then import it into your javascript code:

```javascript
import autocomplete from 'autocompleter';
// or
var autocomplete = require('autocompleter');
```

## Getting Started

```javascript
var countries = [
    { label: 'United Kingdom', value: 'UK' },
    { label: 'United States', value: 'US' }
];

var input = document.getElementById("country");

autocomplete({
    input: input,
    fetch: function(text, update) {
        text = text.toLowerCase();
        // you can also use AJAX requests instead of preloaded data
        var suggestions = countries.filter(n => n.label.toLowerCase().startsWith(text))
        update(suggestions);
    },
    onSelect: function(item) {
        input.value = item.label;
    }
});
```

[Try online](https://jsbin.com/gocayupedo/edit?html,js,output)

## Use with Typescript and Webpack

Simply import the autocompleter in your typescript file:

```javascript
    import autocomplete from "autocompleter";
```

and call the `autocomplete` function as showed below:

```javascript
// replace the `MyInterface` interface with the interface you want to use with autocomplete
autocomplete<MyInterface>({
    input: document.getElementById("myinputfield"),
    emptyMsg: "No items found",
    minLength: 1,
    fetch: (text: string, update: (items: MyInterface[]) => void) => {
	...
    },
    onSelect: (item: MyInterface) => {
	...
    }
});
```

If your custom interface doesn't have the `label` property, you might get a compilation error from typescript. In this case just add an additional type to your code and pass it to the autocompleter:

```javascript
import autocomplete, { AutocompleteItem } from "autocompleter";

// this type will prevent typescript warnings
type MyItem = Item & AutocompleteItem;

autocomplete<MyItem>({
    input: document.getElementById("myinputfield"),
    emptyMsg: "No items found",
    minLength: 1,
    fetch: (text: string, update: (items: Item[]) => void) => {
	...
    },
    onSelect: (item: Item) => {
	...
    },
    render: function(item: Item, currentValue: string): HTMLDivElement | undefined {
        const itemElement = document.createElement("div");
        itemElement.textContent = item.FirstName;
        return itemElement;
    }
});
```

If your interface doesn't have a `label` property, you also have to provide a custom render function.

## Options

You can pass the following options to `autocomplete`:

| Parameter | Description | Default |
| --------- | ----------- | ------- |
|`onSelect`|This method will be called when user choose an item in autocomplete. The selected item will be passed as first parameter.|`-`|
| `onBlur`|This method will be called when input blur event is fired.|`-`|
|`input`|DOM input element must be passed with this parameter and autocomplete will attach itself to this field. Selectors are not supported, but you can just use `document.querySelector('...')` to find the required element.|`-`|
|`minLength`|Specify the minimum length, when autocomplete should appear on the screen.|`2`|
|`emptyMsg`|The message that will be showed when there are no suggestions that match the entered value.|`undefined`|
|`render`|This method allows you to override the rendering function. It will be called for each suggestion and the suggestion object will be passed as first parameter. The current input field value will be passed as second parameter. This function must return a DIV element or `undefined` to skip rendering.|`undefined`|
|`renderGroup`|The same as `render`, but will be called for each group. The first parameter of the function will be the group name. The current input field value will be passed as second parameter. This function must return a `DIV` element or `undefined` to skip rendering.|`undefined`|
|`className`|The autocomplete container will have this class name if specified.|`undefined`|
|`fetch`|This method will be called to prepare suggestions and then pass them to autocomplete. The first parameter is the text in the input field. The second parameter is a callback function that must be called after suggestions are prepared with an array as parameter. If you pass `false` to the callback function, autocomplete will show previous suggestions and will not re-render.|`-`|
|`debounceWaitMs`|Enforces that the `fetch` function will only be called once within the specified time frame (in milliseconds) and delays execution. This prevents flooding your server with AJAX requests.|`0`|
|`customize`|Callback for additional autocomplete customization after rendering is finished. Use this function if you want to change autocomplete default position.|`undefined`|
|`preventSubmit`|Prevents automatic form submit when ENTER is pressed.|`false`|
|`showOnFocus`|Displays suggestions on focus of the input element. Note that if `true`, the minLength property will be ignored and it will always call `fetch`.|`false`|
|`disableAutoSelect`|Prevents the first item in the list from being selected automatically. This option allows you to submit a custom text by pressing `ENTER` even when autocomplete is displayed.|`false`|
|`container`|Provide your own container for the widget. If not specified, a new DIV element will be created.|`undefined`|
|`keysToIgnore`|Keys that will be ignored and not trigger the fetch callback.|see the notice below|

By default, the widget will ignore the following keys:

    Up, Enter, Esc, Right, Left, Shift, Ctrl, Alt, Caps Lock, Windows Key, Tab, F1 - F12

### Sample config using all options

```javascript
autocomplete({
    onSelect: function(item, input) {
        alert(item.value);
    },
    onBlur: function(e) {
        console.log(e);  
    },
    input: document.getElementById('myinput'),
    minLength: 2,
    emptyMsg: 'No elements found',
    render: function(item, currentValue) {
        var div = doc.createElement("div");
        div.textContent = item.label;
        return div;
    },
    renderGroup: function(groupName, currentValue) {
        var div = doc.createElement("div");
        div.textContent = groupName;
        return div;
    },
    className: 'autocomplete-customizations',
    fetch: function(text, callback, trigger, cursorPos) {
        text = text.toLowerCase();
        var suggestions = [{ label: "United States", value: "US" }];
        callback(suggestions);
    },
    debounceWaitMs: 200,
    customize: function(input, inputRect, container, maxHeight) {
        ...
    },
    preventSubmit: true,
    disableAutoSelect: true,
    container: document.createElement("div"),
    keysToIgnore: [...]
});
```

### Display autocomplete above the input field

You can use the following snippet to display autocomplete above the input field if there is not enough space for it.

```typescript
autocomplete({
    ...,
    customize: function(input, inputRect, container, maxHeight) {
        if (maxHeight < 100) {
            container.style.top = "";
            container.style.bottom = (window.innerHeight - inputRect.bottom + input.offsetHeight) + "px";
            container.style.maxHeight = "200px";
        }
    }
});
```

If you don't want to pass this function every time, you can also use spread operator to create your own autocomplete version with default implementation:

```typescript
export default function autocompleteCustomized<T extends AutocompleteItem>(settings: AutocompleteSettings<T>): AutocompleteResult {
    return autocomplete({
        ...settings,
        customize: (input: HTMLInputElement, inputRect: ClientRect | DOMRect, container: HTMLDivElement, maxHeight: number): void => {
            if (maxHeight < 100) {
                container.style.top = "";
                container.style.bottom = (window.innerHeight - inputRect.bottom + input.offsetHeight) + "px";
                container.style.maxHeight = "200px";
            }
        }
    });
}
```

### Unload autocomplete

You can call `destroy` method on the returned object in order to remove event handlers and DOM elements after usage:

```javascript
var autocompl = autocomplete({ /* options */ });
autocompl.destroy();
```

## Grouping suggestions

You can display suggestions separated into one or multiple groups/categories:

```javascript
var countries = [
    { label: 'Canada', value: 'CA', group: 'North America' },
    { label: 'United States', value: 'US', group: 'North America' },
    { label: 'Uzbekistan', value: 'UZ', group: 'Asia' },
];

autocomplete({
    minLength: 1,
    input: document.getElementById("country"),
    fetch: function(text, update) {
        text = text.toLowerCase();
        var suggestions = countries.filter(n => n.label.toLowerCase().startsWith(text))
        update(suggestions);
    },
    onSelect: function(item) {
        alert(item.value);
    }
});
```

[Try online](http://jsbin.com/sodicopeya/1/edit?html,js,output)

Note: Please make sure that all items are sorted by the group property.

## License

Autocomplete is released under the MIT License.

Copyright (c) 2016 - Denys Krasnoshchok

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

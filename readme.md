
Blazing fast and lightweight autocomplete widget without dependencies. Only 1KB gzipped.

Demo: https://kraaden.github.io/autocomplete/

## Installation

If you want to use the library in browser, just include the `autocomplete.js` and `autocomplete.css` into your HTML file.

For `node.js`:

    npm install autocompleter

## Getting Started

```javascript
var countries = [
    { label: 'United Kingdom', item: 'UK' },
    { label: 'United States', item: 'US' }
];

autocomplete({
    input: document.getElementById("country"),
    fetch: function(text, update) {
        text = text.toLowerCase();
        // you can also use AJAX requests instead of preloaded data
        var suggestions = countries.filter(n => n.label.toLowerCase().startsWith(text))
        update(suggestions);
    },
    onSelect: function(item) {
        alert(item); // will display 'US' or 'UK'
    }
});
```

[Try online](https://fiddle.jshell.net/Ly58ktfq/)

## Options

You can pass the following options to `autocomplete`:

|Parameter|Description|Default|
|---|---|---|
|`onSelect`|This method will be called when user choose an item in autocomplete. The selected item will be passed as first parameter.|-|
|`input`|DOM input element must be passed with this parameter and autocomplete will attach itself to this field. Selectors are not supported, but you can just use `document.querySelector('...')` to find the required element.|-|
|`minLength`|Specify the minimum length, when autocomplete should appear on the screen.|`2`|
|`emptyMsg`|The message that will be showed when there are no suggestions that match the entered value.|`undefined`|
|`render`|This method allows you to override the rendering function. It will be called for each suggestion and the suggestion object will be passed as first parameter. This function must return a DIV element or `undefined` to skip rendering.|`undefined`|
|`renderGroup`|The same as `render`, but will be called for each group. The first parameter of the function will be the group name. This function must return a DIV element or `undefined` to skip rendering.|`undefined`|
|`className`|The autocomplete container will have this class name if specified.|`undefined`|
|`fetch`|This method will be called to prepare suggestions and then pass them to autocomplete. The first parameter is the text in the input field. The second parameter is a callback function that must be called after suggestions are prepared with an array as parameter. All elements must have the following format: `{ label: "text", item: ... }`|-|

### Advanced options sample

```javascript
autocomplete({
    onSelect: function(item) {
        alert(item);
    },
    input: document.getElementById('myinput'),
    minLength: 2,
    emptyMsg: 'No elements found',
    render: function(item) {
        var div = doc.createElement("div");
        div.textContent = item.label;
        return div;
    },
    renderGroup: function(groupName) {
        var div = doc.createElement("div");
        div.textContent = groupName;
        return div;
    },
    className: 'autocomplete-customizations',
    fetch: function(text, callback) {
        text = text.toLowerCase();
        var suggestions = [{ label: "United States", item: "US" }];
        update(suggestions);
    }
});
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
    { label: 'United Kingdom', item: 'UK', group: "North America" },
    { label: 'United States', item: 'US', group: "North America" },
    { label: 'Uzbekistan', item: 'UZ', group: "Asia" },
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
        alert(item);
    }
});
```

[Try online](https://fiddle.jshell.net/0qq5bfv3/)

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
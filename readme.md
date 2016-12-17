
## Installation

If you want to use the library in browser, just include the `autocomplete.js` and `autocomplete.css` into your HTML file.

For `node.js`:

    npm install autocompleter

## Sample

```javascript
var countries = [
    { label: 'United Kingdom', item: 'UK' },
    { label: 'United States', item: 'US' }
];

autocomplete({
    input: document.getElementById("country"),
    fetch: function(text, update) {
        text = text.toLowerCase();
        var suggestions =
            countries.filter(n => n.label.toLowerCase().startsWith(text))
        update(suggestions);
    },
    onSelect: function(item) {
        alert(item); // will display 'US' or 'UK'
    }
});
```

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
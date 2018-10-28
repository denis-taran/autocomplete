(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.autocomplete = factory());
}(this, (function () { 'use strict';

  /*
   * https://github.com/kraaden/autocomplete
   * Copyright (c) 2016 Denys Krasnoshchok
   * MIT License
   */
  function autocomplete(settings) {
      // just an alias to minimize JS file size
      var doc = document;
      var container = doc.createElement("div");
      var containerStyle = container.style;
      var userAgent = navigator.userAgent;
      var mobileFirefox = userAgent.indexOf("Firefox") !== -1 && userAgent.indexOf("Mobile") !== -1;
      var debounceWaitMs = settings.debounceWaitMs || 0;
      // 'keyup' event will not be fired on Mobile Firefox, so we have to use 'input' event instead
      var keyUpEventName = mobileFirefox ? "input" : "keyup";
      var items = [];
      var inputValue = "";
      var minLen = settings.minLength || 2;
      var selected;
      var keypressCounter = 0;
      var debounceTimer;
      if (!settings.input) {
          throw new Error("input undefined");
      }
      var input = settings.input;
      container.className = "autocomplete " + (settings.className || "");
      containerStyle.position = "absolute";
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
          keypressCounter++;
          items = [];
          inputValue = "";
          selected = undefined;
          detach();
      }
      /**
       * Update autocomplete position
       */
      function updatePosition() {
          var docEl = doc.documentElement;
          var clientTop = docEl.clientTop || doc.body.clientTop || 0;
          var clientLeft = docEl.clientLeft || doc.body.clientLeft || 0;
          var scrollTop = window.pageYOffset || docEl.scrollTop;
          var scrollLeft = window.pageXOffset || docEl.scrollLeft;
          var inputRect = input.getBoundingClientRect();
          var top = inputRect.top + input.offsetHeight + scrollTop - clientTop;
          var left = inputRect.left + scrollLeft - clientLeft;
          containerStyle.top = top + "px";
          containerStyle.left = left + "px";
          containerStyle.width = input.offsetWidth + "px";
          containerStyle.maxHeight = (window.innerHeight - top) + "px";
          containerStyle.height = "auto";
      }
      updatePosition();
      /**
       * Redraw the autocomplete div element with suggestions
       */
      function update() {
          // delete all children from autocomplete DOM container
          while (container.firstChild) {
              container.removeChild(container.firstChild);
          }
          // function for rendering autocomplete suggestions
          var render = function (item, currentValue) {
              var itemElement = doc.createElement("div");
              itemElement.textContent = item.label || "";
              return itemElement;
          };
          if (settings.render) {
              render = settings.render;
          }
          // function to render autocomplete groups
          var renderGroup = function (groupName, currentValue) {
              var groupDiv = doc.createElement("div");
              groupDiv.textContent = groupName;
              return groupDiv;
          };
          if (settings.renderGroup) {
              renderGroup = settings.renderGroup;
          }
          var fragment = doc.createDocumentFragment();
          var prevGroup = "#9?$";
          items.forEach(function (item) {
              if (item.group && item.group !== prevGroup) {
                  prevGroup = item.group;
                  var groupDiv = renderGroup(item.group, inputValue);
                  if (groupDiv) {
                      groupDiv.className += " group";
                      fragment.appendChild(groupDiv);
                  }
              }
              var div = render(item, inputValue);
              if (div) {
                  div.addEventListener("click", function (ev) {
                      settings.onSelect(item, input);
                      clear();
                      ev.preventDefault();
                      ev.stopPropagation();
                  });
                  if (item === selected) {
                      div.className += " selected";
                  }
                  fragment.appendChild(div);
              }
          });
          container.appendChild(fragment);
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
      function scrollEventHandler() {
          updateIfDisplayed();
      }
      /**
       * Event handler for keyup event
       */
      function keyup(ev) {
          var keyCode = ev.which || ev.keyCode || 0;
          // if multiple keys were pressed, before we get update from server,
          // this may cause redrawing our autocomplete multiple times after the last key press.
          // to avoid this, the number of times keyboard was pressed will be
          // saved and checked before redraw our autocomplete box.
          var savedKeypressCounter = ++keypressCounter;
          var ignore = [38 /* Up */, 13 /* Enter */, 27 /* Esc */, 39 /* Right */, 37 /* Left */, 16 /* Shift */, 17 /* Ctrl */, 18 /* Alt */, 20 /* CapsLock */, 91 /* WindowsKey */, 9 /* Tab */];
          for (var _i = 0, ignore_1 = ignore; _i < ignore_1.length; _i++) {
              var key = ignore_1[_i];
              if (keyCode === key) {
                  return;
              }
          }
          // the down key is used to open autocomplete
          if (keyCode === 40 /* Down */ && containerDisplayed()) {
              return;
          }
          var val = input.value;
          if (val.length >= minLen) {
              clearDebounceTimer();
              debounceTimer = window.setTimeout(function () {
                  settings.fetch(val, function (elements) {
                      if (keypressCounter === savedKeypressCounter && elements) {
                          items = elements;
                          inputValue = val;
                          selected = items.length > 0 ? items[0] : undefined;
                          update();
                      }
                  });
              }, debounceWaitMs);
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
                  update();
              }
              ev.preventDefault();
              if (containerIsDisplayed) {
                  ev.stopPropagation();
              }
              return;
          }
          if (keyCode === 13 /* Enter */ && selected) {
              settings.onSelect(selected, input);
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
          input.removeEventListener(keyUpEventName, keyup);
          input.removeEventListener("blur", blur);
          window.removeEventListener("resize", resizeEventHandler);
          doc.removeEventListener("scroll", scrollEventHandler, true);
          clearDebounceTimer();
          clear();
          // prevent the update call if there are pending AJAX requests
          keypressCounter++;
      }
      // setup event handlers
      input.addEventListener("keydown", keydown);
      input.addEventListener(keyUpEventName, keyup);
      input.addEventListener("blur", blur);
      window.addEventListener("resize", resizeEventHandler);
      doc.addEventListener("scroll", scrollEventHandler, true);
      return {
          destroy: destroy
      };
  }

  return autocomplete;

})));
//# sourceMappingURL=autocomplete.js.map

# Changelog

All notable changes to this project will be documented in this file.

## [9.0.0] - 2023-07-21

### Added

- Improved performance during keyboard navigation (up/down keys) in the autocomplete dropdown. Instead of re-rendering suggestions, the widget now only updates the relevant element attributes. 

### Breaking Changes

- Due to the above optimization, the `render` and `renderGroup` functions will now only be invoked on the initial render and when text in the autocomplete changes.

## [8.0.4] - 2023-06-13

### Fixed

- Resolved an issue where the autocomplete widget was erroneously re-displayed after selection on Firefox Mobile Browser.

## [8.0.3] - 2023-02-14

### Added

- Added a new parameter to `AutocompleteResult` that allows to manually display autocomplete or
  trigger updates without an event like 'click' or 'keydown'

### Fixed

- Rollup configuration

## [8.0.0] - 2023-02-07

### Added

- Added a changelog to simplify the process of tracking updates.
- Changed the event triggering the autocomplete widget from `keyup` to `input`, resolving
  issues listed below.
- The widget can now be displayed on mouse clicks when the `click` option is correctly configured
  and passed to autocomplete.

### Removed

- `keysToIgnore` property is removed and the new `keyup` property should be used instead.

### Fixed

- The mouse paste operation now activates the autocomplete feature as intended.
- The autocomplete widget is now correctly activated when input values are altered on mobile
  devices without using the virtual keyboard (by voice or auto-correction).
- The widget will now properly reattach to its original parent container when a custom
  container is provided for autocomplete, instead of attaching to the body (issue #83)
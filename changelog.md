# Changelog

All notable changes to this project will be documented in this file.

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

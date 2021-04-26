# Contribution

Thanks for taking the time to contribute, or at least consider it.

Here are some important resources:

* [Discord](https://discord.com/invite/ukyK6f6) is where we all chat with each other.

### Submitting changes

Please send a [Pull Request to TornTools](https://github.com/Mephiles/torntools_extension/pull/new/master) with a clear
list of what you've done. Please follow our coding conventions (below) and make sure all of your commits are atomic (one
feature per commit).

Always write a clear log message for your commits. One-line messages are fine for small changes, but bigger changes
should contain more information about the changes.

### Coding conventions

Start reading our code and you'll get the hang of it. We optimize for readability:
We have prettier formatting to help you follow our coding conventions.

* We follow a certain pattern for our files.
    * Each feature has its own file and those are placed in the `extension/scripts/features` folder, in a folder based on the name of it.
    * Both the feature's CSS and JS scripts should reside in the same directory.
        * Don't include empty CSS files.
    * The loading of the script is done in `manifest.json`, so that we can find which page has which features.
* All features should be in its own anonymous function, in the files as specified above.
    * In this function, you register the feature in the Feature Manager.
        * `name` is a string with the feature name.
        * `scope` is a string stating what it's target is
        * `enabled` is function that returns a boolean (or truthy/falsely) which checks the setting of the feature
        * `initialise` is a function that is only run once per page load, when the feature is enabled
        * `execute` is a function that is run every time the feature is started again
        * `cleanup` is a function that is run every time the feature is stopped
        * `loadListeners` is an object that has some fields that tell the manager when to reload the feature
        * `requirements` is a function that evaluates whether all requirements are fulfilled. If not fulfilled, the function should return a string with the reason.
          These requirements can be several things:
            * Mobile
            * Certain elements being there, or not being there.
            * API Access
            * Other things that would make it act as if the feature is no enabled.
* Don't use any of Torn's CSS-classes, they are always subject to change.
    * It's fine to rely on them as selectors.
        * If a class contains `_` or `___`, make sure to not use the class selector, like `.SOMENAME_xyz` but instead
          use an attribute selector `[class*='SOMENAME_']`.
* Some general rules are:
    * Every file/feature **must** be in strict mode, i.e. `"use strict";` at the start of the file.
    * Use `await checkMobile()` but not global variable `mobile`, when checking for mobile.
    * CSS should generally follow order/logic : Wrapper -> Children, i.e. CSS for children comes after its wrapper's CSS.
    * Any setting for a new feature should be defined in `extension/scripts/global/globalData.js `.
* All code should be formatted using Prettier.
    * We indent using tabs with a width of 4.
    * Operators ( = + - * / ) and commas are followed by spaces.
    * Statements end with a semicolon.
    * Strings are surrounded by `"`'s.
    * Although we have automated code formatting via Github Actions, maintain readable code in PRs.
        * Please note that HTML inside of a `.js`-file, won't get automatically formatted. Please format them manually.
* We also use some standard naming conventions.
    * Identifier names (variables and functions) start with a letter and use camelCase.
        * If they are global constants, use UPPERCASE.
* All code should work on as much browsers as possible.
    * Optional Chaining isn't supported by Kiwi Browser.
* Any changes should be added in the `extension/changelog.js` file under the first unreleased version.

## Development Tips

##### Ignore local manifest.json changes.

This can be used to remove the Firefox only setting to avoid warnings in Chromium-browsers.

`git update-index --assume-unchanged extension/manifest.json`

`git update-index --no-assume-unchanged extension/manifest.json`

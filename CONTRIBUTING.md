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
    * Both the feature's CSS and JS scripts should reside in the same directory
    * The loading of the script is done in `manifest.json` so that we can find which page has which features.
* All features should be in a function.
    * The function should be called after it's verified that all required elements are present.
    * Checking if the feature is enabled should happen in the function.
        * All features should have a setting where it can be disabled.
        * If it's not enabled, the function should remove all things is adds.
* Don't use any Torn CSS-classes, they are always subject to change.
    * It's fine to rely on them as selectors.
        * If a class contains `_` or `___`, make sure to not use the class selector, like `.SOMENAME_xyz` but instead
          use an attribute selector `[class*='SOMENAME_']`.
* All code should be formatted using Prettier.
    * We indent using tabs with a width of 4.
    * Operators ( = + - * / ) and commas are followed by spaces.
    * Statements end with a semicolon.
    * Strings are surrounded by `"`'s.
* We also use some standard naming conventions.
    * Identifier names (variables and functions) start with a letter and use camelCase.
        * If it are global constants use UPPERCASE.
* All code should work on as much browsers as possible.
    * Optional Chaining isn't supported by Kiwi Browser.
* Any changes should be added in the `extension/changelog.js` file under the first unreleased version.

## Development Tips

##### Ignore local manifest.json changes.

This can be used to remove the Firefox only setting to avoid warnings in Chromium-browsers.

`git update-index --assume-unchanged extension/manifest.json`

`git update-index --no-assume-unchanged extension/manifest.json`

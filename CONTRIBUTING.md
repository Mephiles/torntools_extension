# Contribution

Thanks for taking the time to contribute, or at least consider it.

Here are some important resources:

* [Discord](https://discord.com/invite/ukyK6f6) is where we all chat with each other.

## Submitting changes

Please send a [Pull Request to TornTools](https://github.com/Mephiles/torntools_extension/pull/new/master) with a clear
list of what you've done. Please follow our coding conventions (below) and make sure all of your commits are atomic (one
feature per commit).

Always write a clear log message for your commits. One-line messages are fine for small changes, but bigger changes
should contain more information about the changes.

## Coding conventions

Start reading our code and you'll get the hang of it. We optimize for readability:

* We follow a certain pattern for our files.
    * Content scripts are placed in the `torntools/scripts/content` folder, in a folder based on the page it loads on.
      The name is the page it loads on prefixed by `tt` and in camelCase.
* All code should be formatted using Prettier.
    * We indent using tabs with a width of 4.
    * Operators ( = + - * / ) and commas are followed by spaces.
    * Statements end with a semicolon.
* We also use some standard formatting conventions.
    * Identifier names (variables and functions) start with a letter and use camelCase.
        * If it are global constants use UPPERCASE.
* All features should be in a function.
    * The function should be called after it's verified that all required elements are present.
* Any changes should be added in the `torntools/changelog.json` file under the first unreleased version.
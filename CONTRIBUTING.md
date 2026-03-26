# Contribution

Thanks for taking the time to contribute, or at least consider it.

Here are some important resources:

- [Discord](https://discord.com/invite/ukyK6f6) is where we all chat with each other.
- [WXT Documentation](https://wxt.dev) is the official documentation for WXT, our used framework.

### Submitting changes

Please send a [Pull Request to TornTools](https://github.com/Mephiles/torntools_extension/pull/new/master) with a clear
list of what you've done. Please follow our coding conventions (below) and make sure all of your commits are atomic (one
feature per commit).

Always write a clear log message for your commits. One-line messages are fine for small changes, but bigger changes
should contain more information about the changes.

### Coding conventions

Start reading our code and you'll get the hang of it. We optimize for readability:
We have prettier formatting to help you follow our coding conventions.

- All have to be written in **TypeScript**.
- We follow a certain pattern for our files.
    - Each feature has its own file, and those are placed in the `extension/features` folder, in a folder based
      on the name of it.
    - Both the feature's CSS and JS scripts should reside in the same directory.
        - Don't include empty CSS files.
    - The loading of the features is defined in `script-manager.ts`.
- All features should be its own class which extends `Feature`, in the files as specified above.
    - Only implement functions that you need. Most of them should be self-explanatory.
    - `precondition` is for features that have requirements other than just the url
        - Example: feature runs on the travel page, but only when actually flying
- Don't use any of Torn's CSS classes, they are always subject to change.
    - It's fine to rely on them as selectors.
        - If a class contains `_` or `___`, make sure to not use the class selector, like `.SOMENAME_xyz` but instead
          use an attribute selector `[class*='SOMENAME_']`.
- Some general rules are:
    - Any setting for a new feature should be defined in `extension/utils/common/data/default-database.js` in `DEFAULT_STORAGE`.
    - We have some preset color variables set inside `extension/utils/common/global/globalVariables.css`. These should be
      used where possible.
- All code should be formatted using Prettier.
    - We indent using tabs with a width of 4.
    - Spaces follow operators (= + - \* /) and commas.
    - Statements end with a semicolon.
    - Strings are surrounded by `"`'s.
    - Although we have automated code formatting via GitHub Actions, maintain readable code in PRs.
        - Please note that HTML inside `.ts` files, won't get automatically formatted. Please format them
          manually.
- We also use some standard naming conventions.
    - Identifier names (variables and functions) start with a letter and use camelCase.
        - If they are global constants, use UPPERCASE.
- All code should work on as many browsers as possible.
    - Optional Chaining isn't supported by Kiwi Browser.
- Any changes should be added in the `public/changelog.json` file under the first unreleased version.
    - First contributions should also update `extension/utils/common/team.js` to add yourself as member and choose a
      color for in the changelog.

## Development Tips

### Testing

- Chrome: [load an unpacked extension](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)
- Firefox: [install a temporary extension](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/)

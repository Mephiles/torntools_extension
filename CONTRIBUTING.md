# Contribution

Thanks for taking the time to contribute, or at least consider it.

Here are some important resources:

- [Discord](https://discord.com/invite/ukyK6f6) is where we all chat with each other.
- [WXT Documentation](https://wxt.dev) is the official documentation for WXT, our used framework.

## Submitting changes

Please send a [Pull Request to TornTools](https://github.com/Mephiles/torntools_extension/pull/new/master) with a clear
list of what you've done. Please follow our coding conventions (below) and make sure all of your commits are atomic (one
feature per commit).

When opening a Pull Request, you must use our [pull request template](.github/pull_request_template.md).
Pull Requests that don't use the template are **closed automatically without review** by our
[PR template check](.github/workflows/pr-template-check.yml). You can fix the description and reopen the PR afterward.

Always write a clear log message for your commits. One-line messages are fine for small changes, but bigger changes
should contain more information about the changes.

## Coding conventions

Start reading our code and you'll get the hang of it. We optimize for readability:
We have Oxfmt formatting and Oxlint linting to help you follow our coding conventions.

- All have to be written in **TypeScript**.
- We follow a certain pattern for our files.
    - Each feature has its own file, and those are placed in the `src/common/features` folder, in a folder based
      on the name of it.
    - Both the feature's CSS and JS scripts should reside in the same directory.
        - Don't include empty CSS files.
    - The loading of the features is defined in `script-manager.ts`.
- All features should be its own class which extends `Feature`, in the files as specified above.
    - Only implement functions that you need. Most of them should be self-explanatory.
    - `precondition` is for features that have requirements other than just the url
        - Example: feature runs on the travel page, but only when actually flying
- We also release userscripts of a subset of our features. To make sure those are kept in line, update the version of impacted userscripts as well.
- Don't use any of Torn's CSS classes, they are always subject to change.
    - It's fine to rely on them as selectors.
        - If a class contains `_` or `___`, make sure to not use the class selector, like `.SOMENAME_xyz` but instead
          use an attribute selector `[class*='SOMENAME_']`.
- Some general rules are:
    - Any setting for a new feature should be defined in `src/common/utils/data/default-database.ts` in `DEFAULT_STORAGE`.
    - We have some preset color variables set inside `src/common/utils/global/globalVariables.css`. These should be
      used where possible.
- All code should be formatted using Oxfmt and linted using Oxlint.
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
- Any changes should be added in the `src/extension/assets/changelog.json` file under the first unreleased version.
    - New entries should be added to the end of the correct section, so entries in each section are ordered from first implemented to last.
    - First contributions should also credit you in `src/common/utils/team.ts`, see [Adding yourself as a contributor](#adding-yourself-as-a-contributor).
- Prefer using modular stylesheets for new features.
- Wherever possible use nested selectors for an easier overview in the stylesheets.

## Adding yourself as a contributor

When you make your first contribution, credit yourself in `src/common/utils/team.ts` by adding a single line to the
`CONTRIBUTORS` map:

```ts
"YourUsername": 1234567,
```

- `YourUsername` has to match the `contributor` value you use in `src/extension/assets/changelog.json` exactly.
- `1234567` is your Torn player ID. Use `null` if you prefer not to link a profile.

## Development Tips

### Testing

- Chrome: [load an unpacked extension](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)
- Firefox: [install a temporary extension](https://extensionworkshop.com/documentation/develop/temporary-installation-in-firefox/)

## Guidelines for external services

External services are welcome to be introduced, but need to follow our guidelines:

- Without any exceptions, it's opt-in.
- While services are allowed to benefit from our users, there has to be a mutual benefit, in favor of our users.
- Requiring authentication is fine (although preferable not, how fewer keys we need to share the better), but requiring an active paid subscription is not. Active paid subscriptions may enhance the experience, but the free version still needs to be sufficiently beneficial.

## AI Policy

We do not actively encourage or discourage AI contributions. There won't be any accommodations for AI tools, except for extending the .gitignore file to make it easier to have a local-only setup.
There are also a couple of guidelines to follow, alongside the other guidelines in this file already.

### Guidelines

1. LLM output is **expressly prohibited** for any direct communications (like issues and pull requests, and comments on them).
    - An exception will be made for LLM-assisted translations if you are having trouble communicating in English. Please explicitly note this ("I have translated this from <original language> with an LLM") and, if possible, post in your original language as well.
2. Contributions should be concise and focused. If the PR claims to target X, and is also touching unrelated Y and Z, it will be rejected.
3. Visual elements should keep the feel of TornTools intact. UI elements generated by LLMs often have a very 'AI feel'. This 'AI feel' is not compatible with the extension, and will result in the PR being rejected.

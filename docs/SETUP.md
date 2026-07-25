# Starlight Docs Setup — Reproduction Steps

How the TornTools documentation site was scaffolded with Astro + Starlight.

## Prerequisites

- Bun (package manager)
- Node.js (build toolchain)
- Existing project with `package.json`

## Step 1: Install Dependencies

```bash
bun add -d astro @astrojs/starlight @astrojs/mdx
```

> `@astrojs/mdx` enables `.mdx` files with component imports (e.g., `<Aside>`).
> If you need Svelte components in docs pages later: `bun add -d @astrojs/svelte`

## Step 2: Create Directory Structure

```bash
mkdir -p docs/src/content/docs/getting-started
mkdir -p docs/src/content/docs/features
mkdir -p docs/src/content/docs/settings
mkdir -p docs/src/assets
mkdir -p docs/public
```

## Step 3: Create `docs/src/content.config.ts`

```ts
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { defineCollection } from "astro:content";

export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};
```

> Astro v7 moved content config from `src/content/config.ts` → `src/content.config.ts`.

## Step 4: Create `docs/tsconfig.json`

```json
{
    "extends": "astro/tsconfigs/base",
    "include": [
        ".astro/types.d.ts",
        "**/*"
    ],
    "exclude": [
        "dist"
    ]
}
```

> Astro ships tsconfig bases that handle `astro:content` and other virtual modules.
> This keeps docs type-checking independent from the extension's tsconfig.

## Step 5: Create `docs/astro.config.mjs`

```js
import mdx from "@astrojs/mdx";
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
	site: "https://mephiles.github.io",
	base: "/torntools_extension",
	integrations: [
		starlight({
			title: "TornTools",
			description: "...",
			logo: { src: "/src/assets/logo.svg" },
			social: [
				{ icon: "github", label: "GitHub", href: "..." },
				{ icon: "discord", label: "Discord", href: "..." },
			],
			editLink: { baseUrl: "https://github.com/..." },
			sidebar: [
				{
					label: "Getting Started",
					items: [{ autogenerate: { directory: "getting-started" } }],
				},
				{
					label: "Features",
					collapsed: true,
					items: [{ autogenerate: { directory: "features" } }],
				},
				{
					label: "Settings",
					items: [{ autogenerate: { directory: "settings" } }],
				},
			],
		}),
		mdx(),
	],
});
```

> `mdx()` must come **after** `starlight()` in the integrations array.
> Starlight includes `astro-expressive-code` which requires being registered before the MDX integration.

> **API changes caught during setup:**
> - `social` changed from `{ github: "...", discord: "..." }` → array format in Starlight v0.33.0
> - `autogenerate` groups changed from `{ label, autogenerate }` → `{ label, items: [{ autogenerate }] }` in v0.39.0

## Step 6: Create Content Pages

### `docs/src/content/docs/index.md` (landing page)

```md
---
title: TornTools
hero:
  tagline: Several tools for Torn.com
  actions:
    - text: Get Started
      link: /getting-started/installation/
      icon: right-arrow
---
```

> Use `hero` frontmatter for a landing page with title, tagline, CTA buttons.

### `docs/src/content/docs/getting-started/installation.md`

Standard Markdown — Starlight auto-generates the sidebar entry and TOC.

## Step 7: Add Scripts to `package.json`

```json
{
    "scripts": {
        "docs:dev": "astro dev --root docs",
        "docs:build": "astro build --root docs",
        "docs:preview": "astro preview --root docs"
    }
}
```

## Step 8: Create GitHub Actions Deploy Workflow

`.github/workflows/docs-deploy.yml` — builds with `bun run docs:build`, deploys `docs/dist/` to GitHub Pages.

## Step 9: Add Logo

Place an SVG at `docs/src/assets/logo.svg`.

## Step 10: Add to `.gitignore`

```
docs/.astro
```

> Prevents auto-generated type/build artifacts from leaking into commits.

## Step 11: Verify

```bash
bun run docs:dev     # hot-reload at localhost:4321
bun run docs:build   # production build
```

---

## Authoring Notes

### MDX Components

Use `.mdx` extension and import Starlight components directly:

```mdx
import { Aside } from "@astrojs/starlight/components";

<Aside type="tip">This is a tip.</Aside>
<Aside type="note">This is a note.</Aside>
<Aside type="caution">This is a warning.</Aside>
<Aside type="danger">This is critical.</Aside>
```

### Links Within Docs

Use root-relative paths: `[Travel Table](/features/travel-table/)`

---

## Pitfalls Hit During Setup

| Problem                                             | Fix                                                                                                                                |
|-----------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
| `tsc` picks up `docs/` and fails on `astro:content` | Added `"docs/**/*"` to root `tsconfig.json` exclude, created standalone `docs/tsconfig.json` extending `astro/tsconfigs/base`.     |
| `<Aside>` components don't render | Requires `.mdx` extension + `@astrojs/mdx` + `mdx()` after `starlight()` in integrations. |
| `The collection "docs" does not exist`              | Astro v7 needs `src/content.config.ts` (not `src/content/config.ts`).                                                              |
| `LegacyContentConfigError`                          | Moved config file to `src/content.config.ts`.                                                                                      |
| Autogenerate label error                            | Updated to `{ label, items: [{ autogenerate }] }` syntax (v0.39.0+).                                                               |
| Social config rejected                              | Changed to array format `[{ icon, label, href }]` (v0.33.0+).                                                                      |

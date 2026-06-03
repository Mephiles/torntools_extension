import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import type { Browser } from "@wxt-dev/browser";
import { defineConfig, type UserManifest } from "wxt";

const APPEND_COMMIT_HASH_ENV = "APPEND_COMMIT_HASH";
const WXT_ZIP_COMMAND = "zip";

function shouldAppendCommitHash() {
	const envValue = process.env[APPEND_COMMIT_HASH_ENV];
	if (envValue !== undefined) return envValue.toLowerCase() !== "false";

	return !process.argv.includes(WXT_ZIP_COMMAND);
}

function appendCommitHashToVersion(manifest: Browser.runtime.Manifest) {
	if (!shouldAppendCommitHash()) return;

	const commitHash = spawnSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).stdout.trim();
	if (!commitHash) return;

	manifest.version_name = `${manifest.version}+${commitHash}`;
}

// See https://wxt.dev/api/config.html
// noinspection JSUnusedGlobalSymbols
export default defineConfig({
	srcDir: "src/extension",
	modules: ["@wxt-dev/auto-icons", "@wxt-dev/module-svelte"],
	autoIcons: {
		baseIconPath: "assets/icon.svg",
	},
	alias: {
		"@common": resolve("./src/common"),
		"@features": resolve("./src/common/features"),
		"@extension": resolve("./src/extension"),
		"@public": resolve("./src/extension/public"),
		"@svelte": resolve("./src/extension/svelte"),
		"@vendor": resolve("./src/extension/utils/vendor"),
	},
	dev: {
		server: {
			// Enable source maps in development
		},
	},
	vite: () => ({
		plugins: [tailwindcss()],
		build: {
			sourcemap: true,
			minify: false,
			target: ["chrome109", "firefox128", "edge109"],
		},
		server: {
			hmr: {
				overlay: true,
			},
		},
		resolve: {
			alias: {
				lie: "false",
				url: "data:text/javascript,export const URL = globalThis.URL;",
			},
		},
		css: {
			modules: {
				localsConvention: "camelCaseOnly",
			},
		},
	}),
	hooks: {
		"build:manifestGenerated": (wxt, manifest) => {
			if (wxt.config.mode === "development") {
				manifest.name += " (DEV)";
			}

			appendCommitHashToVersion(manifest);
		},
	},
	manifest: ({ browser }): UserManifest => {
		const manifest: UserManifest = {
			name: "TornTools",
			description: "Several tools for Torn.",
			// @ts-expect-error Discouraged notation, but supported.
			author: "Gregor Kaljulaid - Mephiles[2087524]",
			host_permissions: ["https://torn.com/"],
			optional_host_permissions: [
				"https://www.tornstats.com/",
				"https://yata.yt/",
				"https://nuke.family/",
				"https://tornuhc.eu/",
				"https://api.no1irishstig.co.uk/",
				"https://prombot.co.uk:8443/",
				"https://api.lzpt.io/",
				"https://what-the-f.de/",
				"https://weav3r.dev/*",
				"https://ffscouter.com/",
				"https://laekna-revive-bot.onrender.com/",
				"https://torn-intel.com/",
			],
			permissions: ["storage", "notifications", "background", "offscreen", "alarms"],
			web_accessible_resources: [
				{
					resources: ["images/*", "*--inject.js", "*/*.js.map", "options.html"],
					matches: ["https://*.torn.com/*"],
				},
			],
			content_security_policy: {
				extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';",
			},
		};

		if (browser === "firefox") {
			manifest.browser_specific_settings = {
				gecko: {
					id: "{3754707b-1aa4-4c6f-96e7-5b1cdc1de5f9}",
					strict_min_version: "128.0",
					data_collection_permissions: {
						required: ["none"],
					},
				},
				gecko_android: {},
			};
		}

		return manifest;
	},
});

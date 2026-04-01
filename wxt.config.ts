import { defineConfig, type UserManifest } from "wxt";
import { resolve } from "node:path";

// See https://wxt.dev/api/config.html
// noinspection JSUnusedGlobalSymbols
export default defineConfig({
	srcDir: "extension",
	// modules: ["@wxt-dev/module-react"],
	modules: ["@wxt-dev/auto-icons"],
	autoIcons: {
		baseIconPath: "assets/icon.svg",
	},
	alias: {
		"@features": resolve("./extension/utils/features"),
		"@vendor": resolve("./extension/utils/vendor"),
	},
	dev: {
		server: {
			// Enable source maps in development
		},
	},
	vite: () => ({
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
			},
		},
		css: {
			modules: {
				localsConvention: "camelCaseOnly"
			}
		}
	}),
	hooks: {
		"build:manifestGenerated": (wxt, manifest) => {
			if (wxt.config.mode === "development") {
				manifest.name += " (DEV)";
			}
		},
	},
	manifest: ({ browser }): UserManifest => {
		const manifest: UserManifest = {
			name: "TornTools WXT",
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
				},
				gecko_android: {},
			};
		}

		return manifest;
	},
});

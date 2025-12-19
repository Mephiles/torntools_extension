import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./vitest.setup.ts"],
		exclude: [...configDefaults.exclude, "dist/"],
		server: {
			deps: {
				inline: ["vitest-chrome"],
			},
		},
	},
	optimizeDeps: { include: ["vitest-chrome"] },
	resolve: {
		alias: {
			"vitest-chrome": "vitest-chrome/lib/index.esm.js",
		},
	},
});

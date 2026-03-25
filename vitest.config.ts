import { defineConfig } from "vitest/config";
import { WxtVitest } from "wxt/testing";

export default defineConfig({
	test: {
		mockReset: true,
		restoreMocks: true,
		setupFiles: ["./vitest.setup.ts"],
		server: {
			deps: {
				inline: ["vitest-chrome"],
			},
		},
	},
	plugins: [WxtVitest()],
	// optimizeDeps: { include: ["vitest-chrome"] },
	// resolve: {
	// 	alias: {
	// 		"vitest-chrome": "vitest-chrome/lib/index.esm.js",
	// 	},
	// },
});

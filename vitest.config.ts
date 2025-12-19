import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: ["./vitest.setup.ts"],
		exclude: [...configDefaults.exclude, "dist/"],
	},
});

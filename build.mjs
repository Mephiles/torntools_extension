import * as esbuild from "esbuild";
import { typecheckPlugin } from "@jgoz/esbuild-plugin-typecheck";

const srcDir = "extension";
const outDir = "dist";
const isWatch = process.argv.includes("--watch");

const buildOptions = {
	entryPoints: [`./${srcDir}/**/*`],
	outdir: outDir,
	target: ["chrome109", "firefox128", "edge109"],
	minify: false,
	metafile: true,
	plugins: [
		typecheckPlugin({
			buildMode: "write-output",
			watch: isWatch,
		}),
	],
	loader: {
		".html": "copy",
		".wav": "copy",
		".svg": "copy",
		".png": "copy",
		".woff2": "copy",
		".ttf": "copy",
		".json": "copy",
		".md": "copy",
		".css": "copy",
		".d.ts": "empty",
		".test.ts": "empty",
	},
	sourcemap: true,
};

if (isWatch) {
	const ctx = await esbuild.context(buildOptions);
	await ctx.watch();
} else {
	const result = await esbuild.build(buildOptions);
	if (result.warnings) {
		console.log(esbuild.formatMessagesSync(result.warnings, { kind: "warning" }).join("\n"));
	}
	if (result.errors) {
		console.log(esbuild.formatMessagesSync(result.errors, { kind: "error" }).join("\n"));
	}
}

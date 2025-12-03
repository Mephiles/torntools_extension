import * as esbuild from "esbuild";

const options = {
	entryPoints: ["extension/**/*"],
	outdir: "dist",
	target: ["chrome109", "firefox128", "edge109"],
	minify: false,
	loader: {
		".html": "copy",
		".wav": "copy",
		".svg": "copy",
		".png": "copy",
		".woff2": "copy",
		".ttf": "copy",
		".json": "copy",
		".md": "copy",
	},
};

if (process.argv.includes("--watch")) {
	const ctx = await esbuild.context(options);
	await ctx.watch();
} else {
	await esbuild.build(options);
}

import * as esbuild from "esbuild";

const buildOptions = {
	entryPoints: ["./extension/**/*"],
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
		".css": "copy",
	},
	sourcemap: false,
};

async function build() {
	try {
		if (process.argv.includes("--watch")) {
			const ctx = await esbuild.context(buildOptions);
			console.log("✅  Started watching successful!");
			await ctx.watch();
		} else {
			await esbuild.build(buildOptions);
			console.log('✅  Build successful! Output generated in the "dist" folder.');
			process.exit(0);
		}
	} catch (e) {
		console.error("❌  Esbuild build failed:", typeof e === "object" && "message" in e ? e.message : e);
		process.exit(1);
	}
}

await build();

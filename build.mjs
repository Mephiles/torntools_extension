import * as esbuild from "esbuild";
// We use 'fast-glob' to efficiently find all source files matching the pattern.
// Note: You must install this package using npm: `npm install fast-glob`
import fastGlob from "fast-glob";
import path from "path";

// --- Configuration ---

const entryPointsGlob = ["./extension/**/*"];

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
	sourcemap: true,
};

// --- Execution ---

async function build() {
	// const entryPoints = await fastGlob(entryPointsGlob);
	// buildOptions.entryPoints = entryPoints;

	// console.log(`Found ${entryPoints.length} entry files for bundling.`);

	try {
		await esbuild.build(buildOptions);
		console.log('✅  Build successful! Output generated in the "dist" folder.');
		process.exit(0);
	} catch (e) {
		console.error("❌  Esbuild build failed:", typeof e === "object" && "message" in e ? e.message : e);
		process.exit(1);
	}
}

await build();

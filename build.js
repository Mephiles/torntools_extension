const esbuild = require("esbuild");
const chokidar = require("chokidar");
const fs = require("fs-extra");
const path = require("path");
const glob = require("fast-glob");
const { performance } = require("perf_hooks");
const { exec } = require("child_process");
const { promisify } = require("util");
const { parse } = require("@aivenio/tsc-output-parser");
const nthline = require("nthline");

const execPromise = promisify(exec);

const srcDir = "extension";
const outDir = "dist";
const isWatch = process.argv.includes("--watch");

const colors = {
	reset: "\x1b[0m",
	bright: "\x1b[1m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	red: "\x1b[31m",
	cyan: "\x1b[36m",
	blue: "\x1b[34m",
};

function textWithColor(text, color) {
	return `${color}${text}${colors.reset}`;
}

async function runTypeChecker() {
	try {
		const parts = ["tsc", "--noEmit", "--pretty false", ...(isWatch ? ["--incremental"] : []), "--project", "tsconfig.json"];
		await execPromise(parts.join(" "));

		return true;
	} catch (err) {
		const errorTexts = err.stdout
			.trim()
			.split(/\r?\n(?=[^ \n].*\(\d+,\d+\): error TS\d+:)/)
			.map((chunk) => chunk.split(/\r?\n/)[0])
			.filter(Boolean);
		const diagnostics = errorTexts.flatMap((errorText) => parse(errorText));
		const esBuildFormats = [];

		for (const diagnostic of diagnostics) {
			const esBuildFormat = await tscDiagnosticToEsbuild(diagnostic);
			esBuildFormats.push(esBuildFormat);
		}

		const formatted = await esbuild.formatMessages(esBuildFormats, {
			kind: "error",
			color: true,
			terminalWidth: 100,
		});

		console.log(formatted.join("\n"));

		return false;
	}
}

async function tscDiagnosticToEsbuild(diagnostic) {
	const lineText = await nthline(diagnostic.value.cursor.value.line - 1, diagnostic.value.path.value);
	const [firstLine, rest] = diagnostic.value.message.value.split("\n", 2);

	return {
		location: {
			column: diagnostic.value.cursor.value.col - 1,
			line: diagnostic.value.cursor.value.line,
			file: diagnostic.value.path.value,
			lineText,
		},
		notes: rest && rest.trim().length > 0 ? [{ text: rest }] : [],
		text: `${firstLine} [${diagnostic.value.tsError.value.errorString}]`,
	};
}

function getOutPath(srcPath) {
	let relativePath = path.relative(srcDir, srcPath);

	if (srcPath.endsWith(".ts")) {
		relativePath = relativePath.slice(0, -3) + ".js";
	}

	return path.resolve(outDir, relativePath);
}

function logSummary(durationMs, operationLogs, isBuild) {
	if (!operationLogs || operationLogs.length === 0 || durationMs === 0) {
		return;
	}

	const counts = operationLogs.reduce((acc, logType) => {
		acc[logType] = (acc[logType] ?? 0) + 1;
		return acc;
	}, {});

	const transpiled = counts.transpile ?? 0;
	const copied = counts.copy ?? 0;
	const deleted = counts.delete ?? 0;
	const skipped = counts.skip ?? 0;
	const errors = counts.error ?? 0;

	const summaryParts = [];

	if (transpiled > 0) {
		summaryParts.push(textWithColor(`${transpiled} transpiled`, colors.blue));
	}

	if (copied > 0) {
		summaryParts.push(textWithColor(`${copied} copied`, colors.green));
	}

	if (deleted > 0) {
		summaryParts.push(textWithColor(`${deleted} deleted`, colors.yellow));
	}

	if (skipped > 0) {
		summaryParts.push(textWithColor(`${skipped} skipped`, colors.cyan));
	}

	if (errors > 0) {
		summaryParts.push(textWithColor(`${errors} errors`, colors.red));
	}

	const totalOps = transpiled + copied + deleted + skipped;
	const durationText = `in ${durationMs.toFixed(2)}ms`;

	if (!isBuild) {
		console.log(`${textWithColor("▶ WATCH UPDATE", colors.bright)} | ${summaryParts.join(" | ")} ${durationText}`);
	} else {
		console.log(`\n${textWithColor("--- BUILD COMPLETE ---", colors.bright)}`);
		console.log(`Summary (${totalOps} ops) | ${summaryParts.join(" | ")} ${durationText}\n`);
	}
}

async function processFile(srcPath, shouldDelete) {
	if (srcPath.endsWith(".d.ts")) {
		return "skip";
	}

	const outPath = getOutPath(srcPath);

	if (shouldDelete) {
		try {
			await fs.remove(outPath);

			return "delete";
		} catch (err) {
			if (err.code === "ENOENT") {
				return "noop";
			}

			console.error(textWithColor(`Deleting ${srcPath} failed:`, colors.red), err);

			return "error";
		}
	}

	try {
		await fs.ensureDir(path.dirname(outPath));

		if (srcPath.endsWith(".ts")) {
			await esbuild.build({
				entryPoints: [srcPath],
				outfile: outPath,
				bundle: false,
				format: "cjs",
				target: "esnext",
				sourcemap: false,
			});

			return "transpile";
		} else {
			await fs.copy(srcPath, outPath);

			return "copy";
		}
	} catch (err) {
		return "error";
	}
}

async function build() {
	try {
		await fs.emptyDir(outDir);
		console.log(`[${textWithColor("CLEAN", colors.yellow)}] Cleared ${outDir} directory.`);
	} catch (err) {
		console.error(textWithColor(`Error cleaning ${outDir} directory:`, colors.red), err);
		process.exit(1);
	}

	const buildStart = performance.now();

	const typeCheckPromise = runTypeChecker();
	const allFiles = await glob(`${srcDir}/**/*.*`, {
		ignore: ["**/node_modules/**"],
	});
	const allResults = await Promise.all(allFiles.map((file) => processFile(file, false)));
	const typeCheckSucceeded = await typeCheckPromise;

	const buildDuration = performance.now() - buildStart;

	logSummary(buildDuration, allResults, true);

	return typeCheckSucceeded && !allResults.includes("error");
}

async function main() {
	console.log(textWithColor(`Starting build for ${srcDir} -> ${outDir}...`, colors.bright));

	const success = await build();

	if (!isWatch) {
		if (!success) {
			process.exit(1);
		}

		return;
	}

	console.log(textWithColor("Watching for changes...", `${colors.bright}${colors.cyan}`));

	const watcher = chokidar.watch(srcDir, {
		ignored: /node_modules/,
		persistent: true,
		ignoreInitial: true,
	});

	let pendingFilePaths = new Set();
	let debounceTimer = null;
	let isRebuilding = false;

	async function rebuild() {
		isRebuilding = true;

		console.log(textWithColor("Rebuilding...", colors.bright));

		const startTime = performance.now();
		const filePaths = Array.from(pendingFilePaths);
		pendingFilePaths.clear();

		const typeCheckPromise = runTypeChecker();
		const logs = await Promise.all(
			filePaths.flatMap(async (filePath) => {
				const exists = await fs.pathExists(filePath);

				// ts file deleted but there is now a js file with same name
				// js will be copied and overwrite old transpiled js file
				// so must not delete;
				if (filePath.endsWith(".ts") && !exists) {
					const jsExists = await fs.pathExists(filePath.replace(".ts", ".js"));

					if (jsExists) {
						return [];
					}
				}

				// js file deleted but there is a ts file with same name
				// ts will be transpiled to js and overwrite old copied js file
				// so must not delete
				if (filePath.endsWith(".js") && !exists) {
					const tsExists = await fs.pathExists(filePath.replace(".js", ".ts"));

					if (tsExists) {
						return [];
					}
				}

				const log = await processFile(filePath, !exists);

				return [log];
			})
		);
		await typeCheckPromise;

		const endTime = performance.now() - startTime;

		logSummary(endTime, logs, false);
		console.log(textWithColor("Watching for changes...", `${colors.bright}${colors.cyan}`));

		isRebuilding = false;

		if (pendingFilePaths.length) {
			schedule();
		}
	}

	function schedule(filePath) {
		if (filePath) {
			pendingFilePaths.add(filePath);
		}

		if (isRebuilding) {
			return;
		}

		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(rebuild, 200);
	}

	watcher.on("add", schedule).on("change", schedule).on("unlink", schedule);
}

main().catch((err) => {
	console.error(textWithColor("Build process failed:", colors.red), err);
	process.exit(1);
});

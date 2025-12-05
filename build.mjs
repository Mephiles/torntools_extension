import * as esbuild from "esbuild";
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";

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

function generateOperationLogs(metafile) {
	const logs = [];
	if (!metafile || !metafile.outputs) return logs;

	for (const output of Object.values(metafile.outputs)) {
		if (!output.inputs) continue;
		const inputs = Object.keys(output.inputs);
		if (inputs.length === 0) continue;

		// Check if any input is a copy type
		const isCopy = inputs.some((input) => {
			const ext = path.extname(input);
			return buildOptions.loader[ext] === "copy";
		});

		logs.push(isCopy ? "copy" : "transpile");
	}
	return logs;
}

const tsConfigPath = "tsconfig.json";
const srcDir = "extension";
const outDir = "dist";
const isWatch = process.argv.includes("--watch");
let isRebuild = false;

const typeCheckPlugin = {
	name: "type-check",
	setup(build) {
		let startTime;

		build.onStart(() => {
			startTime = Date.now();
			if (isRebuild) {
				console.log(textWithColor(`Rebuilding...`, colors.bright));
			}

			isRebuild = true;
		});

		build.onEnd(async (result) => {
			const logs = generateOperationLogs(result.metafile);
			const validTypes = await runTypeChecker();

			if (!validTypes) {
				logs.push("error");
			}

			const duration = Date.now() - startTime;
			logSummary(duration, logs, false);

			console.log(textWithColor("Watching for changes...", `${colors.cyan}`));
		});
	},
};
const buildOptions = {
	entryPoints: [`./${srcDir}/**/*`],
	outdir: outDir,
	target: ["chrome109", "firefox128", "edge109"],
	minify: false,
	metafile: true,
	plugins: isWatch ? [typeCheckPlugin] : [],
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
	},
	sourcemap: false,
};

async function build() {
	console.log(textWithColor(`Starting build for ${srcDir} -> ${outDir}...`, colors.bright));

	try {
		if (isWatch) {
			const ctx = await esbuild.context(buildOptions);
			await ctx.watch();
		} else {
			const startTime = Date.now();
			const validTypes = await runTypeChecker();
			if (!validTypes) {
				process.exit(1);
				return;
			}

			const result = await esbuild.build(buildOptions);
			const logs = generateOperationLogs(result.metafile);
			logSummary(Date.now() - startTime, logs, true);

			process.exit(0);
		}
	} catch (e) {
		console.error("❌  Esbuild failed:", typeof e === "object" && "message" in e ? e.message : e);
		process.exit(1);
	}
}

async function runTypeChecker() {
	const configFileText = fs.readFileSync(tsConfigPath).toString();
	const { config, error: readError } = ts.parseConfigFileTextToJson(tsConfigPath, configFileText);
	if (readError) {
		console.error("Error reading tsconfig file:", ts.flattenDiagnosticMessageText(readError.messageText, "\n"));
		return false;
	}

	const basePath = path.dirname(tsConfigPath);
	const { fileNames, options, errors } = ts.parseJsonConfigFileContent(config, ts.sys, basePath);
	if (errors.length > 0) {
		console.error("Errors in tsconfig configuration:");
		errors.forEach((err) => console.error(ts.flattenDiagnosticMessageText(err.messageText, "\n")));
		return false;
	}

	options.noEmit = true;

	const program = ts.createProgram(fileNames, options);
	const allDiagnostics = Array.from(
		new Set([...ts.getPreEmitDiagnostics(program), ...program.getSemanticDiagnostics(), ...program.getSemanticDiagnostics()])
	);

	if (allDiagnostics.length === 0) {
		return true;
	}

	const allDiagnosticsFormattedForEsbuild = allDiagnostics.map(tscDiagnosticToEsbuild2);
	const formatted = await esbuild.formatMessages(allDiagnosticsFormattedForEsbuild, {
		kind: "error",
		color: true,
		terminalWidth: 100,
	});

	console.log(formatted.join("\n"));

	return false;
}

function tscDiagnosticToEsbuild2(diagnostic) {
	if (!diagnostic.file) {
		return {
			text: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
			id: "typescript-error",
		};
	}

	const sourceText = diagnostic.file.text;

	const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);

	const lineStart = diagnostic.file.getLineStarts()[line];
	const lineEnd = diagnostic.file.getLineStarts()[line + 1] || sourceText.length;
	const lineText = sourceText.substring(lineStart, lineEnd).trimEnd();

	const fullMessage = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
	const [firstLine, ...restLines] = fullMessage.split("\n");

	const notes = restLines.map((text) => ({ text: text.trim() })).filter((note) => note.text.length > 0);

	const errorCode = diagnostic.code ? `TS${diagnostic.code}` : "TS_ERROR";

	return {
		location: {
			column: character,
			line: line + 1,
			file: diagnostic.file.fileName,
			lineText: lineText,
		},
		notes: notes,
		text: `${firstLine} [${errorCode}]`,
		id: errorCode,
	};
}

await build();

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { analyseFeature, entryFile, entryPath } from "./port-userscript/analyse";
import { renderPort } from "./port-userscript/render";

const EXIT_CLEAN = 0;
const EXIT_TODOS = 1;
const EXIT_FAILED = 2;

if (import.meta.main) {
	const args = process.argv.slice(2);
	const feature = args.find((argument) => !argument.startsWith("--"));
	const dryRun = args.includes("--dry-run");
	const force = args.includes("--force");

	if (!feature || args.includes("--help")) {
		console.log("Usage: bun tools/port-userscript.ts <feature-dir> [--dry-run] [--force]");
		process.exit(feature ? EXIT_CLEAN : EXIT_FAILED);
	}

	let analysis: ReturnType<typeof analyseFeature>;
	try {
		analysis = analyseFeature(feature);
	} catch (error) {
		console.error(`Can't port "${feature}": ${(error as Error).message}`);
		process.exit(EXIT_FAILED);
	}

	const rendered = renderPort(analysis);
	const directory = entryPath(feature);
	const files = {
		"metadata.ts": rendered.metadata,
		"settings-manifest.ts": rendered.settingsManifest,
		[entryFile(feature)]: rendered.user,
	};

	console.log(`${analysis.name} → src/userscripts/entries/${feature}`);
	console.log(`  prefix    ${analysis.storagePrefix}`);
	console.log(`  matches   ${analysis.matches.join(", ")}`);
	console.log(`  runAt     ${analysis.runAt}`);
	console.log(`  connect   ${analysis.connect.join(", ") || "none"}`);
	console.log(`  contexts  ${contexts(analysis).join(", ")}`);
	console.log(`  settings  ${analysis.settings.length} entries, ${analysis.overrides.length} overrides`);

	for (const warning of analysis.warnings) console.log(`  note      ${warning}`);

	if (dryRun) {
		for (const [name, content] of Object.entries(files)) console.log(`\n----- ${name} -----\n${content}`);
	} else {
		if (existsSync(directory) && !force) {
			console.error(`\n${directory} already exists. Re-run with --force to overwrite.`);
			process.exit(EXIT_FAILED);
		}

		mkdirSync(directory, { recursive: true });
		const paths = Object.keys(files).map((name) => resolve(directory, name));
		for (const [index, content] of Object.values(files).entries()) writeFileSync(paths[index], content);

		format(paths);
		console.log(`\nWrote ${Object.keys(files).join(", ")}.`);
	}

	if (analysis.todos.length) {
		console.error(`\n${analysis.todos.length} TODO(s) left:`);
		for (const todo of analysis.todos) console.error(`  ${todo.file}: ${todo.message}`);
	}

	process.exit(analysis.todos.length ? EXIT_TODOS : EXIT_CLEAN);
}

function contexts(analysis: ReturnType<typeof analyseFeature>): string[] {
	const names = ["core", "database"];
	if (analysis.network) names.push("network");
	if (analysis.injector) names.push("injector");
	if (analysis.loadItems) names.push("item resolver");
	if (analysis.apiKey) names.push(`${analysis.apiKey} API key`);

	return names;
}

function format(paths: string[]): void {
	try {
		execFileSync("bun", ["oxfmt", ...paths], { stdio: "ignore" });
	} catch {
		console.warn("Couldn't format the generated files; run `bun run format:fix`.");
	}
}

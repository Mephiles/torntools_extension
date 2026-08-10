import { readFileSync, readdirSync } from "node:fs";
import type { Dirent } from "node:fs";
import { rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";
import { build } from "vite";
import monkey from "vite-plugin-monkey";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = resolve(root, ".output/userscripts");
const author = "DeKleineKobini [2114440] and the TornTools team";
const icon = "https://www.google.com/s2/favicons?sz=64&domain=torn.com";

const aliases = {
	"@common": resolve(root, "src/common"),
	"@features": resolve(root, "src/common/features"),
	"@svelte": resolve(root, "src/extension/svelte"),
	"@userscripts": resolve(root, "src/userscripts"),
};

async function buildUserscript(entryName: string, userscript: UserscriptMetadata, fileSuffix: string, beta = false, dev = false) {
	await build({
		root,
		configFile: false,
		publicDir: false,
		resolve: { alias: aliases },
		plugins: [
			svelte(),
			monkey({
				entry: `src/userscripts/entries/${entryName}/${entryName}.user.ts`,
				userscript: {
					name: `TORN: TornTools - ${userscript.name}${beta ? " BETA" : ""}${dev ? " DEV" : ""}`,
					namespace: `torntools.${entryName}${beta ? "--beta" : ""}${dev ? "--dev" : ""}`,
					version: `${dev ? "dev-" : ""}${userscript.version}${beta ? "-beta" : ""}`,
					description: userscript.description,
					author,
					license: "GPL-3.0-or-later",
					icon,
					match: userscript.matches,
					"run-at": userscript.runAt,
					supportURL: "https://github.com/Mephiles/torntools_extension/issues",
					contributionURL: "https://buymeacoffee.com/dekleinekobini",
					connect: userscript.connect,
				},
				build: {
					fileName: `${entryName}${fileSuffix}`,
					metaFileName: false,
					// Detect GM_* usage in the bundle and bake @grant lines in during this single build.
					autoGrant: true,
				},
			}),
		],
		css: {
			modules: {
				localsConvention: "camelCase",
			},
		},
		build: {
			emptyOutDir: false,
			minify: false,
			outDir: outputDir,
			sourcemap: false,
			target: ["chrome109", "firefox128", "edge109"],
		},
	});
}

function detectPermissionsFromOutput(filePath: string): string[] {
	const code = readFileSync(filePath, "utf-8");
	return [...code.matchAll(/^\/\/ @grant\s+(.+)$/gm)].map((match) => match[1]);
}

const targetEntry = process.argv[2]?.startsWith("--") ? undefined : process.argv[2];
const isBeta = process.argv.includes("--beta");
const isDev = process.argv.includes("--dev");
const concurrencyFlag = process.argv.indexOf("--concurrency");
const CONCURRENCY = concurrencyFlag !== -1 ? Math.max(1, Number(process.argv[concurrencyFlag + 1])) : 5;

if (!targetEntry) {
	await rm(outputDir, { recursive: true, force: true });
}

const entriesPath = "src/userscripts/entries";
const metadataFileName = "metadata.ts";
const entries = readdirSync(entriesPath, { withFileTypes: true });
const targets = entries.filter((entry): entry is Dirent => entry.isDirectory() && (!targetEntry || entry.name === targetEntry));

async function buildEntry(entry: Dirent): Promise<string> {
	const metadataPath = resolve(root, entriesPath, entry.name, metadataFileName);

	try {
		const module = await import(metadataPath);
		const metadata = module.default as UserscriptMetadata;

		await buildUserscript(entry.name, metadata, `.user.js`, isBeta, isDev);

		const outputPath = resolve(outputDir, `${entry.name}.user.js`);
		const permissions = detectPermissionsFromOutput(outputPath);

		return `${metadata.name}: ${permissions.join(", ") || "none"}`;
	} catch (error) {
		console.error(`Failed building [${entry.name}]:`, error);
		return "";
	}
}

const results: string[] = [];
let next = 0;
await Promise.all(
	Array.from({ length: Math.min(CONCURRENCY, targets.length) }, async () => {
		while (next < targets.length) {
			const index = next++;
			results[index] = await buildEntry(targets[index]);
		}
	}),
);

results.filter((result) => !!result).forEach((result) => console.log(result));

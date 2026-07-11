import { readdirSync, readFileSync, unlink } from "node:fs";
import { rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";
import { build } from "vite";
import type { MonkeyUserScript } from "vite-plugin-monkey";
import monkey from "vite-plugin-monkey";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = resolve(root, ".output/userscripts");
const author = "DeKleineKobini [2114440] and the TornTools team";
const icon = "https://www.google.com/s2/favicons?sz=64&domain=torn.com";

const GM_PERMISSION_PATTERNS: Record<string, RegExp> = {
	"GM.getValue": /\bGM\.getValue\b/,
	"GM.getValues": /\bGM\.getValues\b/,
	"GM.setValue": /\bGM\.setValue\b/,
	"GM.setValues": /\bGM\.setValues\b/,
	GM_addStyle: /\bGM_addStyle\b/,
	"GM.info": /\bGM\.info\b/,
	"GM.registerMenuCommand": /\bGM\.registerMenuCommand\b/,
	"GM.notification": /\bGM\.notification\b/,
	"GM.setClipboard": /\bGM\.setClipboard\b/,
	"GM.getClipboard": /\bGM\.getClipboard\b/,
	"GM.xmlHttpRequest": /\bGM\.xmlHttpRequest\b/,
	unsafeWindow: /\bunsafeWindow\b/,
};

function detectPermissionsFromCode(code: string): string[] {
	const detected: string[] = [];

	for (const [permission, pattern] of Object.entries(GM_PERMISSION_PATTERNS)) {
		if (pattern.test(code)) {
			detected.push(permission);
		}
	}

	return detected;
}

const aliases = {
	"@common": resolve(root, "src/common"),
	"@features": resolve(root, "src/common/features"),
	"@userscripts": resolve(root, "src/userscripts"),
};

async function buildUserscript(entryName: string, userscript: UserscriptMetadata, fileSuffix: string, grants?: MonkeyUserScript["grant"]) {
	await build({
		root,
		configFile: false,
		publicDir: false,
		resolve: { alias: aliases },
		plugins: [
			monkey({
				entry: `src/userscripts/entries/${entryName}/${entryName}.user.ts`,
				userscript: {
					name: `TORN: TornTools - ${userscript.name}`,
					namespace: `torntools.${entryName}`,
					version: userscript.version,
					description: userscript.description,
					author,
					license: "GPL-3.0-or-later",
					icon,
					match: userscript.matches,
					"run-at": userscript.runAt,
					grant: grants,
					supportURL: "https://github.com/Mephiles/torntools_extension/issues",
					contributionURL: "https://buymeacoffee.com/dekleinekobini",
					connect: userscript.connect,
				},
				build: {
					fileName: `${entryName}${fileSuffix}`,
					metaFileName: false,
					autoGrant: false,
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

const targetEntry = process.argv[2];

if (!targetEntry) {
	await rm(outputDir, { recursive: true, force: true });
}

const entriesPath = "src/userscripts/entries";
const metadataFileName = "metadata.ts";
const entries = readdirSync(entriesPath, { withFileTypes: true });

for (const entry of entries) {
	if (!entry.isDirectory()) continue;
	if (targetEntry && entry.name !== targetEntry) continue;

	const metadataPath = resolve(root, entriesPath, entry.name, metadataFileName);

	try {
		const module = await import(metadataPath);
		const metadata = module.default as UserscriptMetadata;

		await buildUserscript(entry.name, metadata, `.detect.user.js`);

		const detectPath = resolve(outputDir, `${entry.name}.detect.user.js`);
		const code = readFileSync(detectPath, "utf-8");
		const permissions = detectPermissionsFromCode(code);

		await buildUserscript(entry.name, metadata, `.user.js`, (permissions.length > 0 ? permissions : undefined) as any);

		unlink(detectPath, () => {});

		console.log(`${metadata.name}: ${permissions.join(", ") || "none"}`);
	} catch {
		console.error(`No '${metadataFileName}' found in folder: [${entry.name}]`);
	}
}

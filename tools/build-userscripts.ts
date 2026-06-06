import { readFileSync, unlink } from "node:fs";
import { rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { USERSCRIPTS } from "@userscripts/registry";
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

async function buildUserscript(userscript: (typeof USERSCRIPTS)[number], fileName: string, grants?: MonkeyUserScript["grant"]) {
	await build({
		root,
		configFile: false,
		publicDir: false,
		resolve: { alias: aliases },
		plugins: [
			monkey({
				entry: `src/userscripts/entries/${userscript.name.toLowerCase().replaceAll(" ", "-")}.user.ts`,
				userscript: {
					name: `TORN: TornTools - ${userscript.name}`,
					namespace: `torntools.${userscript.name.toLowerCase().replaceAll(" ", "-")}`,
					version: userscript.version,
					description: userscript.description,
					author,
					license: "GPL-3",
					icon,
					match: userscript.matches,
					"run-at": userscript.runAt,
					grant: grants,
					supportURL: "https://github.com/Mephiles/torntools_extension/issues",
					contributionURL: "https://buymeacoffee.com/dekleinekobini",
				},
				build: {
					fileName: fileName,
					metaFileName: false,
					autoGrant: false,
				},
			}),
		],
		build: {
			emptyOutDir: false,
			minify: false,
			outDir: outputDir,
			sourcemap: false,
			target: ["chrome109", "firefox128", "edge109"],
		},
	});
}

await rm(outputDir, { recursive: true, force: true });

for (const userscript of USERSCRIPTS) {
	const id = userscript.name.toLowerCase().replaceAll(" ", "-");

	await buildUserscript(userscript, `${id}.detect.user.js`);

	const detectPath = resolve(outputDir, `${id}.detect.user.js`);
	const code = readFileSync(detectPath, "utf-8");
	const permissions = detectPermissionsFromCode(code);

	await buildUserscript(userscript, `${id}.user.js`, (permissions.length > 0 ? permissions : undefined) as any);

	unlink(detectPath, () => {});

	console.log(`${userscript.name}: ${permissions.join(", ") || "none"}`);
}

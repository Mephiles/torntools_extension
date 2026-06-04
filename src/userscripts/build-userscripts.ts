import { rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { USERSCRIPTS } from "@userscripts/registry";
import { build } from "vite";
import monkey from "vite-plugin-monkey";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const outputDir = resolve(root, ".output/userscripts");
const author = "DeKleineKobini [2114440] and the TornTools team";
const icon = "https://www.google.com/s2/favicons?sz=64&domain=torn.com";

await rm(outputDir, { recursive: true, force: true });

for (const userscript of USERSCRIPTS) {
	const id = userscript.name.toLowerCase().replaceAll(" ", "-");

	await build({
		root,
		configFile: false,
		publicDir: false,
		resolve: {
			alias: {
				"@common": resolve(root, "src/common"),
				"@features": resolve(root, "src/common/features"),
				"@userscripts": resolve(root, "src/userscripts"),
			},
		},
		plugins: [
			monkey({
				entry: `src/userscripts/entries/${id}.user.ts`,
				userscript: {
					name: `TORN: TornTools - ${userscript.name}`,
					namespace: `torntools.${id}`,
					version: userscript.version,
					description: userscript.description,
					author,
					license: "GPL-3",
					icon,
					match: userscript.matches,
					"run-at": userscript.runAt,
					grant: userscript.grants ?? "none",
				},
				build: {
					fileName: `${id}.user.js`,
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

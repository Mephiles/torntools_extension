/**
 * Bumps the version of all userscript metadata.ts files.
 *
 * Usage: bun tools/bump-userscript-versions.ts         # patch bump (1.0.1 → 1.0.2)
 *        bun tools/bump-userscript-versions.ts --minor  # minor bump (1.0.1 → 1.1.0)
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const entriesDir = resolve(root, "src/userscripts/entries");
const bump: "patch" | "minor" = process.argv.includes("--minor") ? "minor" : "patch";

const metadataFiles = readdirSync(entriesDir, { withFileTypes: true })
	.filter((d) => d.isDirectory())
	.map((d) => resolve(entriesDir, d.name, "metadata.ts"))
	.filter((f) => {
		try {
			statSync(f);
			return true;
		} catch {
			return false;
		}
	});

for (const file of metadataFiles) {
	const content = readFileSync(file, "utf-8");
	const match = content.match(/version:\s*"(\d+)\.(\d+)\.(\d+)"/);
	if (!match) {
		console.warn(`⚠  Skipping ${file}: no version found`);
		continue;
	}

	const [, major, minor, patch] = match;
	let newMinor = Number(minor);
	let newPatch = Number(patch);

	if (bump === "minor") {
		newMinor++;
		newPatch = 0;
	} else {
		newPatch++;
	}

	const newVersion = `${major}.${newMinor}.${newPatch}`;
	const newContent = content.replace(/version:\s*"\d+\.\d+\.\d+"/, `version: "${newVersion}"`);
	writeFileSync(file, newContent, "utf-8");

	const name = file.split("/").at(-2);
	console.log(`${name}: ${match[0].match(/\d+\.\d+\.\d+/)![0]} → ${newVersion}`);
}

console.log(`\nDone. Bumped ${metadataFiles.length} userscript(s) (${bump}).`);

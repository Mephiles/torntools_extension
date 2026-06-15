#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import type { ChangelogEntry } from "@/utils/changelog";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CHANGELOG_PATH = resolve(ROOT, "src/extension/assets/changelog.json");
const OUTPUT_DIR = resolve(ROOT, ".output/release");

async function generate() {
	const entry = await latestChangelogEntry();

	await generateHTML(entry);
}

async function latestChangelogEntry(): Promise<ChangelogEntry> {
	const raw = await readFile(CHANGELOG_PATH, "utf-8");
	const changelog: ChangelogEntry[] = JSON.parse(raw);
	if (!changelog.length) {
		console.error("No changelog entries found.");
		process.exit(1);
	}

	return changelog[0];
}

async function generateHTML(entry: ChangelogEntry) {
	const html = buildHtml(entry);

	await mkdir(OUTPUT_DIR, { recursive: true });
	const file = resolve(OUTPUT_DIR, "release.html");
	await writeFile(file, html);
	console.log(`Written: release.html (${html.length} chars)`);
}

function buildHtml(entry: ChangelogEntry): string {
	return [
		`<h5>TornTools ${versionString(entry.version)}${entry.title && entry.title !== "Beta" ? ` - ${entry.title}` : ""}</h5>`,
		...Object.entries(entry.logs)
			.filter(([, items]) => items.length > 0)
			.flatMap(([key, items]) => [
				`<h6>${key.charAt(0).toUpperCase() + key.slice(1)}</h6>`,
				"<ul>",
				...items.map(({ message }) => `  <li>${encodeCharacters(Array.isArray(message) ? message.join(" ") : message)}</li>`),
				"</ul>",
			]),
	].join("\n");
}

function versionString(v: ChangelogEntry["version"]): string {
	return `v${v.major}.${v.minor}.${v.build}`;
}

function encodeCharacters(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

await generate();

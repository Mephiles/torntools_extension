#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import type { ChangelogEntry } from "@/utils/changelog";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CHANGELOG_PATH = resolve(ROOT, "src/extension/assets/changelog.json");
const OUTPUT_DIR = resolve(ROOT, ".output/release");
const DISCORD_CHAR_LIMIT = 2000;

async function generate() {
	const entry = await latestChangelogEntry();

	await generateMarkdown(entry);
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

async function generateMarkdown(entry: ChangelogEntry) {
	const message = buildMarkdown(entry);
	const pages = splitMessage(message, DISCORD_CHAR_LIMIT);

	await mkdir(OUTPUT_DIR, { recursive: true });

	await Promise.all(
		pages.map(async (page, i) => {
			const filename = pages.length === 1 ? "release-discord.txt" : `release-discord-${i + 1}.txt`;
			const file = resolve(OUTPUT_DIR, filename);
			await writeFile(file, page);
			console.log(`Written: ${filename} (${page.length} chars)`);
		}),
	);
}

function buildMarkdown(entry: ChangelogEntry): string {
	return [
		`# TornTools ${versionString(entry.version)}${entry.title && entry.title !== "Beta" ? ` - ${entry.title}` : ""}`,
		...Object.entries(entry.logs)
			.filter(([_, items]) => items.length > 0)
			.flatMap(([key, items]) => [
				"",
				`### ${key.charAt(0).toUpperCase() + key.slice(1)}`,
				"",
				...items.map(({ message }) => `* ${Array.isArray(message) ? message.join(" ") : message}`),
			]),
		"",
		"Chrome Web Store: **{unknown}**",
		"Firefox Addon Store: **{unknown}**",
		"Edge Browser Add-ons: **{unknown}**",
	].join("\n");
}

function versionString(v: ChangelogEntry["version"]): string {
	return `v${v.major}.${v.minor}.${v.build}`;
}

function splitMessage(message: string, limit: number): string[] {
	const lines = message.split("\n");

	const rawPages = lines.reduce<string[]>((pages, line) => {
		if (pages.length === 0) {
			pages.push(line);
			return pages;
		}

		const last = pages[pages.length - 1];
		const candidate = `${last}\n${line}`;
		if (candidate.length <= limit) {
			pages[pages.length - 1] = candidate;
		} else {
			pages.push(line);
		}
		return pages;
	}, []);

	if (rawPages.length <= 1) return rawPages;

	// Second pass: rebuild from full message with footers, handling overflow
	const total = rawPages.length;
	return rawPages.reduce<{ pages: string[]; remaining: string }>(
		(acc, _rawPage, i) => {
			const isLast = i === total - 1;
			const footer = isLast ? `and that's it (${total}/${total})` : `.... and more (${i + 1}/${total})`;
			const maxContent = limit - footer.length - 1;

			const remainingLines = acc.remaining.split("\n");

			// Find split point: first line index where cumulative length exceeds maxContent
			let splitAt = remainingLines.length;
			let cumulative = "";
			for (let j = 0; j < remainingLines.length; j++) {
				const candidate = cumulative ? `${cumulative}\n${remainingLines[j]}` : remainingLines[j];
				if (candidate.length > maxContent) {
					splitAt = j;
					break;
				}
				cumulative = candidate;
			}

			let contentLines = remainingLines.slice(0, splitAt);
			let next = remainingLines.slice(splitAt).join("\n");
			if (next.startsWith("\n")) next = next.slice(1);

			// Don't leave a heading orphaned at the end of a page
			const lastNonBlank = contentLines.findLastIndex((l) => l !== "");
			if (lastNonBlank >= 0 && contentLines[lastNonBlank].startsWith("### ")) {
				const orphaned = contentLines.slice(lastNonBlank - 1); // include preceding blank
				contentLines = contentLines.slice(0, lastNonBlank - 1);
				next = `${orphaned.join("\n")}\n${next}`;
			}

			// If next page starts mid-section, prepend the last heading for context
			const trimmed = next.replace(/^\n+/, "");
			const lastHeading = Array.from(contentLines)
				.reverse()
				.find((l) => l.startsWith("### "));
			if (lastHeading && trimmed && !trimmed.startsWith("# ") && !trimmed.startsWith("### ")) {
				next = `\n${lastHeading}\n\n${next}`;
			}

			const content = contentLines.join("\n");

			acc.pages.push(`${content}\n${footer}`.trim());
			return { pages: acc.pages, remaining: next };
		},
		{ pages: [], remaining: message },
	).pages;
}

await generate();

/**
 * Validates PREFERENCE_SEARCH_DATA for redundant keywords.
 * A keyword is redundant if it is already present (case-insensitive) in:
 *   1. The entry's label, or
 *   2. The last key of the entry's path.
 *
 * Usage: bun run tools/validate-preference-keywords.ts
 */

import { getLastKey, PREFERENCE_SEARCH_DATA } from "@extension/entrypoints/options/components/preferences/preference-search-data";

interface RedundantKeyword {
	path: string;
	label: string;
	keyword: string;
	matchedIn: "label" | "lastKey";
	matchedAgainst: string;
}

const redundants: RedundantKeyword[] = [];

for (const entry of PREFERENCE_SEARCH_DATA) {
	if (!entry.keywords?.length) continue;

	const labelLower = entry.label.toLowerCase();
	const lastKey = getLastKey(entry.path).toLowerCase();

	for (const kw of entry.keywords) {
		const kwLower = kw.toLowerCase();

		if (labelLower.includes(kwLower)) {
			redundants.push({
				path: entry.path,
				label: entry.label,
				keyword: kw,
				matchedIn: "label",
				matchedAgainst: entry.label,
			});
		} else if (lastKey.includes(kwLower)) {
			redundants.push({
				path: entry.path,
				label: entry.label,
				keyword: kw,
				matchedIn: "lastKey",
				matchedAgainst: getLastKey(entry.path),
			});
		}
	}
}

if (!redundants.length) {
	console.log("✅ No redundant keywords found.");
	process.exit(0);
}

console.log(`❌ Found ${redundants.length} redundant keyword(s):\n`);

for (const r of redundants) {
	console.log(`  Path:      ${r.path}`);
	console.log(`  Label:     "${r.label}"`);
	console.log(`  Keyword:   "${r.keyword}" — already in ${r.matchedIn} ("${r.matchedAgainst}")`);
	console.log();
}

process.exit(1);

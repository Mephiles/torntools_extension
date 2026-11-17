import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import { getSourceFile, listFiles, REPOSITORY_ROOT, stringValue, walk } from "./ast";

const PREFERENCE_DATA = resolve(REPOSITORY_ROOT, "src/extension/entrypoints/options/components/preferences/preference-search-data.ts");
const API_FETCHER = resolve(REPOSITORY_ROOT, "src/common/utils/functions/api-fetcher.ts");
const DEFAULT_DATABASE = resolve(REPOSITORY_ROOT, "src/common/utils/data/default-database.ts");
const COMMON_SETTINGS_ENTRIES = resolve(REPOSITORY_ROOT, "src/userscripts/entries/settings/common-settings-entries.ts");
const ENTRIES_DIRECTORY = resolve(REPOSITORY_ROOT, "src/userscripts/entries");

/** Page name (from `getPage()`) to userscript `@match` patterns. Extend when a page shows up as unknown. */
export const PAGE_MATCHES: Record<string, string[]> = {
	"abroad-people": ["https://*.torn.com/index.php?page=people*"],
	attack: ["https://*.torn.com/page.php?sid=attack*"],
	attacklog: ["https://*.torn.com/page.php?sid=attacklog*"],
	auction: ["https://*.torn.com/amarket.php*"],
	bank: ["https://*.torn.com/bank.php*"],
	bazaar: ["https://*.torn.com/bazaar.php*"],
	bigalgunshop: ["https://*.torn.com/bigalgunshop.php*"],
	blackjack: ["https://*.torn.com/page.php?sid=blackjack*"],
	blackjackstatistics: ["https://*.torn.com/page.php?sid=blackjackstatistics*"],
	bookie: ["https://*.torn.com/page.php?sid=bookie*"],
	bounties: ["https://*.torn.com/bounties.php*"],
	casino: ["https://*.torn.com/page.php?sid=casino*"],
	chainreport: ["https://*.torn.com/war.php?step=chainreport*"],
	city: ["https://*.torn.com/city.php*"],
	companies: ["https://*.torn.com/companies.php*"],
	crapsstats: ["https://*.torn.com/page.php?sid=crapsstats*"],
	"crimes-v1": ["https://*.torn.com/crimes.php*"],
	"crimes-v2": ["https://*.torn.com/page.php?sid=crimes*"],
	displaycase: ["https://*.torn.com/displaycase.php*"],
	education: ["https://*.torn.com/page.php?sid=education*"],
	elimination: ["https://*.torn.com/page.php?sid=elimination*"],
	enemies: ["https://*.torn.com/page.php?sid=list&type=enemies*"],
	events: ["https://*.torn.com/events.php*"],
	factions: ["https://*.torn.com/factions.php*"],
	forums: ["https://*.torn.com/forums.php*"],
	friends: ["https://*.torn.com/page.php?sid=list&type=friends*"],
	gym: ["https://*.torn.com/gym.php*"],
	highlow: ["https://*.torn.com/page.php?sid=highlow*"],
	highlowstats: ["https://*.torn.com/page.php?sid=highlowstats*"],
	hof: ["https://*.torn.com/page.php?sid=halloffame*"],
	holdemstats: ["https://*.torn.com/page.php?sid=holdemstats*"],
	home: ["https://*.torn.com/index.php*"],
	hospital: ["https://*.torn.com/hospitalview.php*"],
	hunting: ["https://*.torn.com/index.php?page=hunting*"],
	item: ["https://*.torn.com/item.php*"],
	itemmarket: ["https://*.torn.com/page.php?sid=ItemMarket*"],
	itemuseparcel: ["https://*.torn.com/itemuseparcel.php*"],
	jail: ["https://*.torn.com/jailview.php*"],
	joblist: ["https://*.torn.com/joblist.php*"],
	kenostatistics: ["https://*.torn.com/page.php?sid=kenostatistics*"],
	lottery: ["https://*.torn.com/page.php?sid=lottery*"],
	messages: ["https://*.torn.com/messages.php*"],
	missions: ["https://*.torn.com/page.php?sid=missions*"],
	museum: ["https://*.torn.com/museum.php*"],
	pawnshop: ["https://*.torn.com/shops.php?step=pawnshop*"],
	personalstats: ["https://*.torn.com/personalstats.php*"],
	poker: ["https://*.torn.com/page.php?sid=holdem*"],
	"poker-fullscreen": ["https://*.torn.com/page.php?sid=holdemfull*"],
	"points-market": ["https://*.torn.com/pmarket.php*"],
	preferences: ["https://*.torn.com/preferences.php*"],
	profiles: ["https://*.torn.com/profiles.php*"],
	properties: ["https://*.torn.com/properties.php*"],
	racing: ["https://*.torn.com/page.php?sid=racing*"],
	raidreport: ["https://*.torn.com/war.php?step=raidreport*"],
	rankreport: ["https://*.torn.com/war.php?step=rankreport*"],
	rehab: ["https://*.torn.com/index.php?page=rehab*"],
	roulettestatistics: ["https://*.torn.com/page.php?sid=roulettestatistics*"],
	russianroulettestatistics: ["https://*.torn.com/page.php?sid=russianroulettestatistics*"],
	shops: ["https://*.torn.com/shops.php*"],
	slotsstats: ["https://*.torn.com/page.php?sid=slotsstats*"],
	stocks: ["https://*.torn.com/page.php?sid=stocks*"],
	targets: ["https://*.torn.com/page.php?sid=list&type=targets*"],
	trade: ["https://*.torn.com/trade.php*"],
	travel: ["https://*.torn.com/page.php?sid=travel*"],
	userlist: ["https://*.torn.com/page.php?sid=UserList*"],
	warreport: ["https://*.torn.com/war.php?step=warreport*"],
};

/** `settings.external.*` keys whose `FETCH_PLATFORMS` name doesn't match when lowercased. */
const EXTERNAL_PLATFORM_ALIASES: Record<string, string> = {
	playgroundtorntools: "playground_torntools",
};

export interface PreferenceEntry {
	label: string;
	description?: string;
}

export function readPreferences(): Map<string, PreferenceEntry> {
	const preferences = new Map<string, PreferenceEntry>();
	const data = variableInitializer(PREFERENCE_DATA, "PREFERENCE_SEARCH_DATA");
	if (!data || !ts.isArrayLiteralExpression(data)) return preferences;

	for (const element of data.elements) {
		if (!ts.isObjectLiteralExpression(element)) continue;

		const values = objectValues(element);
		if (values.path && values.label) preferences.set(values.path, { label: values.label, description: values.description });
	}

	return preferences;
}

/** Every known preference path and its type, from the default storage definition. */
export function readSettingSchema(): Map<string, string> {
	const schema = new Map<string, string>();
	const object = unwrapObject(variableInitializer(DEFAULT_DATABASE, "DEFAULT_STORAGE"));
	if (object) visitDefaults(object, "", schema);

	return schema;
}

function visitDefaults(object: ts.ObjectLiteralExpression, prefix: string, schema: Map<string, string>): void {
	for (const property of object.properties) {
		if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name)) continue;

		const path = prefix ? `${prefix}.${property.name.text}` : property.name.text;
		const nested = unwrapObject(property.initializer);
		if (nested) {
			visitDefaults(nested, path, schema);
			continue;
		}

		const initializer = unwrapExpression(property.initializer);
		if (!initializer || !ts.isNewExpression(initializer) || initializer.expression.getText() !== "DefaultSetting") continue;

		schema.set(path, stringValue(initializer.arguments?.[0]) ?? "unknown");
	}
}

/** Trims method/array members off a chain until it matches a known preference, e.g. `settings.hideIcons.includes` becomes `settings.hideIcons`. */
export function knownSettingPath(chain: string, schema: Map<string, string>): string | undefined {
	let candidate = chain;
	while (candidate.includes(".")) {
		if (schema.has(candidate)) return candidate;
		candidate = candidate.slice(0, candidate.lastIndexOf("."));
	}

	return undefined;
}

export function readFetchPlatforms(): Map<string, string> {
	const platforms = new Map<string, string>();
	const object = unwrapObject(variableInitializer(API_FETCHER, "FETCH_PLATFORMS"));
	if (!object) return platforms;

	for (const property of object.properties) {
		if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name)) continue;

		const url = stringValue(property.initializer);
		if (url) platforms.set(property.name.text, url);
	}

	return platforms;
}

/** Manifest entries shared between userscripts, keyed by the settings path they fill. */
export function readSharedEntries(): Map<string, string> {
	const entries = new Map<string, string>();

	walk(getSourceFile(COMMON_SETTINGS_ENTRIES), (node) => {
		if (!ts.isVariableDeclaration(node) || !ts.isIdentifier(node.name)) return;

		const values = node.initializer && ts.isObjectLiteralExpression(node.initializer) ? objectValues(node.initializer) : undefined;
		if (values?.path) entries.set(values.path, node.name.text);
	});

	return entries;
}

/** Shared entries that belong to the same service, e.g. its connection toggle and API key. */
export function sharedEntriesFor(platform: string, shared: Map<string, string>): { constant: string; path: string }[] {
	const expected = [`settings.external.${platform}`, `api.${platform}.key`];

	return expected.flatMap((path) => {
		const constant = shared.get(path);
		return constant ? [{ constant, path }] : [];
	});
}

export function platformOfExternalSetting(path: string): string {
	const key = path.slice("settings.external.".length).toLowerCase();
	return EXTERNAL_PLATFORM_ALIASES[key] ?? key;
}

export function hostOf(fetchPlatforms: Map<string, string>, platform: string): string | undefined {
	const url = fetchPlatforms.get(platform);
	if (!url) return undefined;

	try {
		return new URL(url).hostname;
	} catch {
		return undefined;
	}
}

export function existingStoragePrefixes(exclude?: string): Set<string> {
	const prefixes = new Set<string>();

	for (const file of listFiles(ENTRIES_DIRECTORY, ".user.ts")) {
		if (exclude && file.includes(`${ENTRIES_DIRECTORY}/${exclude}/`)) continue;

		const code = readFileSync(file, "utf-8");
		for (const match of code.matchAll(/registerDatabaseUserscriptContext\("([^"]+)"/g)) prefixes.add(match[1]);
	}

	return prefixes;
}

/** Initializer of a named variable in a source file. */
function variableInitializer(file: string, name: string): ts.Expression | undefined {
	let found: ts.Expression | undefined;
	walk(getSourceFile(file), (node) => {
		if (!ts.isVariableDeclaration(node) || node.name.getText() !== name) return;

		found = node.initializer;
		return false;
	});

	return found;
}

/** Unwraps `as const` / `satisfies` / parentheses around an object literal. */
function unwrapObject(node: ts.Expression | undefined): ts.ObjectLiteralExpression | undefined {
	const expression = unwrapExpression(node);
	return expression && ts.isObjectLiteralExpression(expression) ? expression : undefined;
}

function unwrapExpression(node: ts.Expression | undefined): ts.Expression | undefined {
	if (!node) return undefined;
	if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node)) return unwrapExpression(node.expression);

	return node;
}

function objectValues(object: ts.ObjectLiteralExpression): Record<string, string> {
	const values: Record<string, string> = {};
	for (const property of object.properties) {
		if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name)) continue;

		const value = stringValue(property.initializer);
		if (value !== undefined) values[property.name.text] = value;
	}

	return values;
}

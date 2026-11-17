import { describe, expect, it } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { analyseFeature, uniqueStoragePrefix } from "./port-userscript/analyse";
import type { PortAnalysis } from "./port-userscript/analyse";
import { readRegistrations } from "./port-userscript/registration";
import { renderPort } from "./port-userscript/render";
import { knownSettingPath, readSettingSchema } from "./port-userscript/tables";

const REPOSITORY_ROOT = resolve(import.meta.dirname, "..");
const ENTRIES_DIRECTORY = resolve(REPOSITORY_ROOT, "src/userscripts/entries");

/** Ports the analyser reproduces from the committed entries, one per shape of userscript. */
const CASES = [
	"align-left", // isEnabled-only override, every page, document-start
	"alcohol-nerve", // item resolver, required API key, Torn API connection
	"city-items", // injector context
	"company-specials", // shared connection entries
	"flying-time", // single page
	"item-values", // multiple pages
	"prevent-join-attacks", // injector at document-start, secondary setting
];

describe("matches the committed entries", () => {
	for (const feature of CASES) {
		it(feature, async () => {
			const analysis = analyseFeature(feature);
			const metadata = (await import(`../src/userscripts/entries/${feature}/metadata.ts`)).default;
			const entries = (await import(`../src/userscripts/entries/${feature}/settings-manifest.ts`)).default;

			expect(analysis.matches).toEqual(sorted(metadata.matches));
			expect(analysis.runAt).toBe(metadata.runAt);
			expect(analysis.connect).toEqual(sorted(metadata.connect ?? []));
			expect(derivedSettings(analysis)).toEqual(committedSettings(entries));
			expect(derivedOverrides(analysis)).toEqual(committedOverrides(entries));
			expect(analysis.storagePrefix).toBe(committedStoragePrefix(feature));
		});
	}
});

describe("settings classification", () => {
	it("detects the injector through the listener wrappers", () => {
		expect(analyseFeature("weapon-bonus-information").injector).toBe(true);
		expect(analyseFeature("weapon-experience").injector).toBe(false);
	});
	it("imports a named export by name", () => {
		const rendered = renderPort(analyseFeature("csv-challenge-contributions"));

		expect(rendered.user).toContain(
			'import { CSVChallengeContributionsFeature } from "@features/csv-challenge-contributions/csv-challenge-contributions";',
		);
	});

	it("keeps a non-boolean isEnabled setting user-configurable", () => {
		const analysis = analyseFeature("hide-icons");

		expect(analysis.settings.map((entry) => entry.path)).toContain("settings.hideIcons");
		expect(analysis.overrides).toEqual([]);
	});

	it("trims method and array members off a setting path", () => {
		const schema = readSettingSchema();

		expect(knownSettingPath("settings.hideIcons.includes", schema)).toBe("settings.hideIcons");
		expect(knownSettingPath("settings.hideIcons", schema)).toBe("settings.hideIcons");
		expect(knownSettingPath("settings.not.a.setting", schema)).toBeUndefined();
	});
});

describe("registration pages", () => {
	const registrations = readRegistrations();

	it("reads a single page guard", () => {
		expect(registrations.find((registration) => registration.className === "CompanySpecialsFeature")?.pages).toEqual(new Set(["companies"]));
	});

	it("unions multiple page guards", () => {
		const pages = registrations.filter((registration) => registration.className === "CompanyIDFeature").map((registration) => registration.pages);

		expect(pages).toEqual([new Set(["companies"]), new Set(["joblist"])]);
		expect(analyseFeature("company-id").matches).toEqual(["https://*.torn.com/companies.php*", "https://*.torn.com/joblist.php*"]);
	});

	it("treats a global registration as every page", () => {
		expect(registrations.find((registration) => registration.className === "AlignLeftFeature")?.pages).toBe("all");
	});
});

describe("storage prefixes", () => {
	it("suffixes a prefix another entry already uses", () => {
		expect(uniqueStoragePrefix("tt_x", new Set())).toBe("tt_x");
		expect(uniqueStoragePrefix("tt_x", new Set(["tt_x"]))).toBe("tt_x2");
		expect(uniqueStoragePrefix("tt_x", new Set(["tt_x", "tt_x2"]))).toBe("tt_x3");
	});
});

describe("rendering", () => {
	it("leaves TODOs in the generated files", () => {
		const rendered = renderPort(analyseFeature("hide-icons"));

		expect(rendered.metadata).toContain("// TODO(port): No preference label to derive the description from.");
	});

	it("renders every file", () => {
		const analysis: PortAnalysis = {
			name: "Example Thing",
			description: "Do the example thing.",
			version: "1.0.0",
			matches: ["https://*.torn.com/examples.php*"],
			runAt: "document-end",
			connect: ["api.torn.com"],
			storagePrefix: "tt_et",
			classes: [
				{
					className: "ExampleThing",
					file: "/src/common/features/example-thing/example-thing.ts",
					name: "Example Thing",
					immediate: false,
					namedExport: false,
				},
			],
			settings: [{ path: "settings.pages.examples.option", label: "Example option" }],
			sharedEntries: [],
			overrides: [{ path: "settings.pages.examples.thing", value: true }],
			network: true,
			injector: false,
			loadItems: false,
			apiKey: "optional",
			todos: [{ file: "metadata", message: "Review the description." }],
			warnings: [],
		};

		expect(renderPort(analysis)).toEqual({
			metadata: `// TODO(port): Review the description.
import type { UserscriptMetadata } from "@userscripts/entries/userscript-metadata";

const metadata: UserscriptMetadata = {
	name: "Example Thing",
	description: "Do the example thing.",
	version: "1.0.0",
	matches: ["https://*.torn.com/examples.php*"],
	runAt: "document-end",
	connect: ["api.torn.com"],
};

export default metadata;
`,
			settingsManifest: `import type { SettingsManifest } from "@userscripts/settings/settings-manifest.ts";

const settingsManifest: SettingsManifest = {
	settings: [
		{ path: "settings.pages.examples.option", label: "Example option" },
	],
	overrides: [
		{ path: "settings.pages.examples.thing", value: true },
	],
};

export default settingsManifest;
`,
			user: `import { FEATURE_MANAGER } from "@common/utils/context";
import ExampleThing from "@features/example-thing/example-thing";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { registerDatabaseUserscriptContext } from "@userscripts/runtime/context/script-database-context";
import { registerNetworkUserscriptContext } from "@userscripts/runtime/context/script-network-context";
import { optionalAPIKey } from "@userscripts/runtime/script-fetch";
import settingsManifest from "./settings-manifest.ts";

(async () => {
	registerCoreUserscriptContext();
	await registerDatabaseUserscriptContext("tt_et", settingsManifest);
	registerNetworkUserscriptContext();
	optionalAPIKey();

	FEATURE_MANAGER.registerFeature(new ExampleThing());
})();
`,
		});
	});
});

function sorted(values: readonly string[]): string[] {
	return [...values].sort((left, right) => left.localeCompare(right));
}

function derivedSettings(analysis: PortAnalysis): string[] {
	return sorted([...analysis.settings.map((entry) => entry.path), ...analysis.sharedEntries.map((entry) => entry.path)]);
}

function committedSettings(entries: { settings?: { path: string }[] }): string[] {
	return sorted((entries.settings ?? []).map((entry) => entry.path));
}

function derivedOverrides(analysis: PortAnalysis): string[] {
	return sorted(
		analysis.overrides.filter((override) => !override.path.startsWith("settings.apiUsage.")).map((override) => `${override.path}=${override.value}`),
	);
}

function committedOverrides(entries: { overrides?: { path: string; value: unknown }[] }): string[] {
	return sorted(
		(entries.overrides ?? []).filter((override) => !override.path.startsWith("settings.apiUsage.")).map((override) => `${override.path}=${override.value}`),
	);
}

function committedStoragePrefix(feature: string): string {
	const directory = resolve(ENTRIES_DIRECTORY, feature);
	const userFile = readdirSync(directory).find((file) => file.endsWith(".user.ts"));
	if (!userFile) throw new Error(`No userscript entry for ${feature}.`);

	const match = /registerDatabaseUserscriptContext\("([^"]+)"/.exec(readFileSync(resolve(directory, userFile), "utf-8"));
	return match?.[1] ?? "";
}

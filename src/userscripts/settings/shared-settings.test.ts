import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import type { SettingsManifest } from "./settings-manifest";
import {
	applyApiPatch,
	applyManifestOverrides,
	applySettingsPatch,
	forgetScript,
	getEffectiveApi,
	getEffectiveSettings,
	getRegisteredScripts,
	mergeDefaults,
	registerScript,
	updateSharedPreference,
} from "./shared-settings";

class MemoryStorage implements Storage {
	private values = new Map<string, string>();

	get length() {
		return this.values.size;
	}

	clear() {
		this.values.clear();
	}

	getItem(key: string) {
		return this.values.get(key) ?? null;
	}

	key(index: number) {
		return [...this.values.keys()][index] ?? null;
	}

	removeItem(key: string) {
		this.values.delete(key);
	}

	setItem(key: string, value: string) {
		this.values.set(key, value);
	}
}

let storage: MemoryStorage;

beforeEach(() => {
	storage = new MemoryStorage();
	(globalThis as any).localStorage = storage;
	(globalThis as any).GM = { info: { version: "1.2.3", script: { name: "TORN: TornTools - Test Script" } } };
});

afterEach(() => {
	delete (globalThis as any).localStorage;
	delete (globalThis as any).GM;
});

describe("shared settings", () => {
	it("deep merges a patch over the defaults and replaces arrays", () => {
		expect(mergeDefaults<Record<string, unknown>>({ a: 1, nested: { b: 2 } }, { nested: { c: 3 } })).toEqual({ a: 1, nested: { b: 2, c: 3 } });
		expect(mergeDefaults({ list: [1] }, { list: [2] })).toEqual({ list: [2] });
		expect(mergeDefaults("a", "b")).toBe("b");
	});

	it("applies manifest overrides at the given path", () => {
		const overrides = [{ path: "settings.logLevel", value: "debug" }] as const;

		expect(applyManifestOverrides({ logLevel: "warn" }, overrides, "settings")).toEqual({ logLevel: "debug" });
	});

	it("stores only changed leaves and reads the effective value", async () => {
		await applySettingsPatch({ pages: { itemmarket: { bazaarItemHighlight: false } } });

		expect(getEffectiveSettings().pages.itemmarket.bazaarItemHighlight).toBe(false);
		expect(JSON.parse(storage.getItem("tt_shared_settings")!)).toEqual({
			version: 1,
			settings: { pages: { itemmarket: { bazaarItemHighlight: false } } },
			api: {},
		});
	});

	it("lets a script override a stored value without changing the stored value", async () => {
		const manifest: SettingsManifest = {
			settings: [],
			overrides: [{ path: "settings.pages.itemmarket.bazaarItemHighlight", value: true }],
		};

		await applySettingsPatch({ pages: { itemmarket: { bazaarItemHighlight: false } } });

		expect(getEffectiveSettings(manifest).pages.itemmarket.bazaarItemHighlight).toBe(true);
		expect(getEffectiveSettings().pages.itemmarket.bazaarItemHighlight).toBe(false);
	});

	it("migrates the legacy API key into the shared api settings", () => {
		storage.setItem("tt_scripts_key", "legacy-key");

		expect(getEffectiveApi().torn.key).toBe("legacy-key");
	});

	it("does not restore the legacy API key after the user clears it", async () => {
		storage.setItem("tt_scripts_key", "legacy-key");
		expect(getEffectiveApi().torn.key).toBe("legacy-key");

		await applyApiPatch({ torn: { key: "" } });

		expect(getEffectiveApi().torn.key).toBe("");
	});

	it("writes API patches", async () => {
		await applyApiPatch({ torn: { key: "new-key" } });

		expect(getEffectiveApi().torn.key).toBe("new-key");
	});

	it("updates a single preference by path", async () => {
		await updateSharedPreference("settings.logLevel", "debug");

		expect(getEffectiveSettings().logLevel).toBe("debug");
	});

	it("registers a script with its name, version and settings", () => {
		registerScript("tt_test", { settings: [{ path: "settings.logLevel", label: "Log level" }] });

		expect(getRegisteredScripts()).toMatchObject([
			{
				id: "tt_test",
				name: "Test Script",
				version: "1.2.3",
				settings: [{ path: "settings.logLevel", label: "Log level" }],
			},
		]);
	});

	it("uses the userscript namespace as the registration id when available", () => {
		(globalThis as any).GM.info.script.namespace = "torntools.test--beta";

		registerScript("tt_test", { settings: [] });

		expect(getRegisteredScripts()[0]?.id).toBe("torntools.test--beta");
	});

	it("drops registrations after the TTL", () => {
		registerScript("tt_test", { settings: [{ path: "settings.logLevel", label: "Log level" }] });

		const afterTtl = Date.now() + 15 * 24 * 60 * 60 * 1000;
		expect(getRegisteredScripts(afterTtl)).toHaveLength(0);
		expect(storage.length).toBe(0);
	});

	it("forgets a registration on request", () => {
		registerScript("tt_test", { settings: [{ path: "settings.logLevel", label: "Log level" }] });

		forgetScript("tt_test");

		expect(getRegisteredScripts()).toHaveLength(0);
	});
});

import { describe, expect, it } from "bun:test";
import type { RegisteredScript } from "./settings-manifest";
import { buildSettingsLayout, getHiddenSettingPaths } from "./settings-sections";

function script(partial: Partial<RegisteredScript> & Pick<RegisteredScript, "id" | "name">): RegisteredScript {
	return {
		version: "1.0.0",
		updatedAt: Date.now(),
		settings: [],
		overrides: [],
		...partial,
	};
}

describe("settings layout", () => {
	it("shows a path once under Shared when multiple scripts expose it", () => {
		const layout = buildSettingsLayout([
			script({ id: "one", name: "One", settings: [{ path: "settings.logLevel", label: "Log level" }] }),
			script({ id: "two", name: "Two", settings: [{ path: "settings.logLevel", label: "Log level" }] }),
		]);

		expect(layout.scripts).toHaveLength(0);
		expect(layout.shared).toHaveLength(1);
		expect(layout.shared[0]!.scripts).toEqual(["One", "Two"]);
	});

	it("hides paths forced by any script", () => {
		const scripts = [
			script({ id: "one", name: "One", settings: [{ path: "settings.external.tornw3b", label: "TornW3B" }] }),
			script({ id: "two", name: "Two", overrides: [{ path: "settings.external.tornw3b", value: true }] }),
		];

		expect(getHiddenSettingPaths(scripts)).toEqual(new Set(["settings.external.tornw3b"]));
		const layout = buildSettingsLayout(scripts);
		expect(layout.shared).toHaveLength(0);
		expect(layout.scripts).toHaveLength(0);
	});

	it("keeps unique paths in their own script section", () => {
		const layout = buildSettingsLayout([
			script({ id: "one", name: "One", settings: [{ path: "settings.logLevel", label: "Log level" }] }),
			script({ id: "two", name: "Two", settings: [{ path: "settings.developer", label: "Developer" }] }),
		]);

		expect(layout.shared).toHaveLength(0);
		expect(layout.scripts.map((section) => [section.script.id, section.entries.map((entry) => entry.path)])).toEqual([
			["one", ["settings.logLevel"]],
			["two", ["settings.developer"]],
		]);
	});

	it("drops scripts without any visible settings", () => {
		const layout = buildSettingsLayout([
			script({ id: "one", name: "One" }),
			script({ id: "two", name: "Two", settings: [{ path: "settings.logLevel", label: "Log level" }] }),
		]);

		expect(layout.scripts.map((section) => section.script.id)).toEqual(["two"]);
	});
});

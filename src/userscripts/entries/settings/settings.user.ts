import { setTTStorage } from "@common/utils/context";
import { setFilters } from "@common/utils/data/database";
import type { DatabaseFilters } from "@common/utils/data/database";
import { DEFAULT_STORAGE, getDefaultStorage } from "@common/utils/data/default-database";
import { elementBuilder } from "@common/utils/functions/dom";
import { findElement } from "@common/utils/functions/find-elements";
import { requireElementOptionally } from "@common/utils/functions/requires";
import { registerCoreUserscriptContext } from "@userscripts/runtime/context/script-core-context";
import { PDAScriptStorage, TTScriptStorage } from "@userscripts/runtime/script-storage";
import { isPDA } from "@userscripts/utils/script-utils";
import { mount } from "svelte";
import SettingsPage from "./settings-page.svelte";

(async () => {
	if (findElement("#tt-userscript-settings-root", true)) return;

	const wrapper = await requireElementOptionally(".content-wrapper");
	if (!wrapper) return;

	registerCoreUserscriptContext();

	const storage = isPDA() ? new PDAScriptStorage() : new TTScriptStorage("tt_settings");
	setTTStorage(storage);

	const defaultFilters = getDefaultStorage(DEFAULT_STORAGE.filters) as DatabaseFilters;
	const storedFilters = (await storage.get("filters")) as Partial<DatabaseFilters> | undefined;
	setFilters({ ...defaultFilters, ...storedFilters, containers: { ...defaultFilters.containers, ...storedFilters?.containers } });

	const root = elementBuilder({ type: "div", id: "tt-userscript-settings-root", class: "mt10" });
	wrapper.insertAdjacentElement("beforeend", root);

	mount(SettingsPage, { target: root });
})();

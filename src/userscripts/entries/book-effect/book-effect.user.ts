import { setupItemPage } from "@common/pages/item-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import BookEffectFeature from "@features/book-effect/book-effect";
import type { Feature } from "@features/feature";
import { registerUserscriptContext } from "@userscripts/runtime/script-context";
import { ScriptItemResolver } from "@userscripts/runtime/script-item-resolver";

(async () => {
	await registerUserscriptContext("tt_be");
	await ScriptItemResolver.loadItems();

	setupItemPage();

	const feature: Feature = new BookEffectFeature();
	FEATURE_MANAGER.registerFeature(feature);
})();

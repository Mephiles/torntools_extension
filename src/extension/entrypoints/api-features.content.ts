import { loadDatabase } from "@common/utils/data/database";
import { loadAPIDemo } from "@features/api-demo/api-demo";
import { loadAPISelections } from "@features/api-selections/api-selections";
import { loadAutoAPIFill } from "@features/auto-api-fill/auto-api-fill";
import { loadAPIPretty } from "@features/auto-pretty/auto-pretty";
import { registerExtensionContext } from "@/runtime/extension-context";

// noinspection JSUnusedGlobalSymbols
export default defineContentScript({
	matches: ["https://*.torn.com/api.html*"],

	runAt: "document_end",

	async main() {
		registerExtensionContext();
		await loadDatabase();

		loadAPISelections().catch((err) => console.error(err));
		loadAutoAPIFill();
		loadAPIDemo();
		loadAPIPretty();
	},
});

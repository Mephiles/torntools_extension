import { loadDatabase } from "@/utils/common/data/database";
import { loadAPISelections } from "@/features/api-selections/api-selections";
import { loadAutoAPIFill } from "@/features/auto-api-fill/auto-api-fill";
import { loadAPIDemo } from "@/features/api-demo/api-demo";
import { loadAPIPretty } from "@/features/auto-pretty/auto-pretty";

// noinspection JSUnusedGlobalSymbols
export default defineContentScript({
	matches: ["https://*.torn.com/api.html*"],

	runAt: "document_end",

	async main() {
		await loadDatabase();

		loadAPISelections().then(() => {});
		loadAutoAPIFill();
		loadAPIDemo();
		loadAPIPretty();
	},
});

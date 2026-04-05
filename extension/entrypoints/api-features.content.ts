import { loadDatabase } from "@/utils/common/data/database";
import { loadAPISelections } from "@/features/api-selections/api-selections";

// noinspection JSUnusedGlobalSymbols
export default defineContentScript({
	matches: ["https://*.torn.com/api.html*"],

	runAt: "document_end",

	async main() {
		await loadDatabase();

		loadAPISelections().then(() => console.log("[TornTools] Loaded API Selections."));
	},
});

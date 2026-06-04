import "drag-drop-touch";
import { defineContentScript } from "wxt/utils/define-content-script";

// noinspection JSUnusedGlobalSymbols
export default defineContentScript({
	matches: ["https://*.torn.com/item.php*", "https://*.torn.com/crimes.php*"],

	runAt: "document_start",

	main() {
		// Nothing, we are loading the drag-drop-touch library here.
	},
});

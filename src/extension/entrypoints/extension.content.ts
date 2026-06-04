import { registerExtensionContext } from "@/runtime/extension-context";
import { scriptManager } from "@/runtime/script-manager";

// noinspection JSUnusedGlobalSymbols
export default defineContentScript({
	matches: ["https://*.torn.com/*"],
	excludeMatches: [
		"https://*.torn.com/logout.php*",
		"https://*.torn.com/api.html*",
		"https://*.torn.com/swagger.php*",
		"https://*.torn.com/joblisting.php*",
		"https://wiki.torn.com/*",
		"https://api.torn.com/*",
	],

	runAt: "document_start",

	main() {
		registerExtensionContext();
		scriptManager();
	},
});

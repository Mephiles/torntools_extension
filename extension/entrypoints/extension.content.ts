import { scriptManager } from "@/utils/script-manager";

export default defineContentScript({
	matches: ["https://*.torn.com/*"],
	exclude: [
		"https://*.torn.com/logout.php*",
		"https://*.torn.com/api.html*",
		"https://*.torn.com/swagger.php*",
		"https://*.torn.com/joblisting.php*",
		"https://wiki.torn.com/*",
		"https://api.torn.com/*",
	],

	runAt: "document_start",

	main() {
		scriptManager();
	},
});

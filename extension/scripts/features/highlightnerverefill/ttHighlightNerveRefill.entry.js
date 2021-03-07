"use strict";

(async () => {
	featureManager.registerFeature(
		"Highlight Nerve Refill",
		"global",
		() => settings.pages.sidebar.highlightNerve,
		null,
		applyStyle,
		applyStyle,
		{
			storage: ["settings.pages.sidebar.highlightNerve", "settings.apiUsage.user.refills", "userdata.refills.nerve_refill_used"],
		},
		() => {
			if (!hasAPIData() || !settings.apiUsage.user.refills) return "No API access.";
		}
	);

	function applyStyle() {
		document.documentElement.style.setProperty(
			"--torntools-highlight-nerve",
			!userdata.refills.nerve_refill_used && settings.pages.sidebar.highlightNerve ? `#6e8820` : "#333"
		);
	}
})();

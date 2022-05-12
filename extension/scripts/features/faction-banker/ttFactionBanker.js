"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const params = getSearchParameters();
	if (params.get("step") !== "your") return;

	const feature = featureManager.registerFeature(
		"Faction Banker",
		"faction",
		() => settings.pages.faction.banker,
		initialiseListeners,
		showHelper,
		removeHelper,
		{
			storage: ["settings.pages.faction.banker"],
		},
		null
	);

	function initialiseListeners() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_GIVE_TO_USER].push(() => {
			if (!feature.enabled()) return;

			showHelper();
		});
	}

	async function showHelper() {
		const controlsPanel = document.find("#faction-controls");
		if (controlsPanel.getAttribute("aria-expanded") !== "true") return;

		const input = await requireElement("#money-user");
		if (input.classList.contains("tt-modified")) return;

		input.classList.add("tt-modified");

		["change", "paste", "keyup", "select", "focus", "input"].forEach((event) => input.addEventListener(event, showBalance));
		document.find("#money-user-cont").addEventListener("click", showBalance);
	}

	function showBalance() {
		const input = document.find("#money-user");
		if (!input) return;

		const user = input.value.match(/(.*) \[(\d*)]/i);
		if (!user) {
			document.find("label[for='money-user']").textContent = "Select player: ";
			return;
		}

		const name = user[1];
		const balance =
			parseInt(document.find(`.depositor .user.name[href='/profiles.php?XID=${user[2]}']`).parentElement.find(".amount .money").dataset.value) || 0;

		document.find("label[for='money-user']").textContent = `${name} has a balance of $${formatNumber(balance, { decimals: 0 })}`;
	}

	function removeHelper() {
		const input = document.find("#money-user.tt-modified");
		if (!input) return;

		["change", "paste", "keyup", "select", "focus", "input"].forEach((event) => input.removeEventListener(event, showBalance));
		document.find("#money-user-cont").removeEventListener("click", showBalance);
	}
})();

(async () => {
	if (!getPageStatus().access) return;

	const params = getSearchParameters();
	if (params.get("step") !== "your") return;

	let originalText: string | undefined;

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

			showBalance();
		});
	}

	async function showHelper() {
		const controlsPanel = document.querySelector("#faction-controls");
		if (controlsPanel.getAttribute("aria-expanded") !== "true") return;

		const input = await requireElement("#money-user");
		if (input.classList.contains("tt-modified")) return;

		input.classList.add("tt-modified");

		["change", "paste", "keyup", "select", "focus", "input"].forEach((event) => input.addEventListener(event, showBalance));
		document.querySelector("#money-user-cont").addEventListener("click", showBalance);
	}

	function showBalance() {
		const input = document.querySelector<HTMLInputElement>("#money-user");
		if (!input) return;

		const label = document.querySelector(".select-wrap .placeholder");
		if (typeof originalText === "undefined" && !label.textContent.includes("balance of")) {
			originalText = label.textContent;
		}

		const user = input.value.match(/(.*) \[(\d*)]/i);
		if (!user) {
			label.textContent = originalText;
			return;
		}

		const name = user[1];
		const balance =
			parseInt(
				document.querySelector(`.depositor .user.name[href='/profiles.php?XID=${user[2]}']`).parentElement.querySelector<HTMLElement>(".amount .money")
					.dataset.value
			) || 0;

		label.textContent = `${name} has a balance of $${formatNumber(balance)}`;
	}

	function removeHelper() {
		const input = document.querySelector("#money-user.tt-modified");
		if (!input) return;

		["change", "paste", "keyup", "select", "focus", "input"].forEach((event) => input.removeEventListener(event, showBalance));
		document.querySelector("#money-user-cont").removeEventListener("click", showBalance);
		if (typeof originalText === "string") {
			document.querySelector(".select-wrap .placeholder").textContent = originalText;
		}
	}
})();

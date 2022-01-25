"use strict";

const isOwnFaction = getSearchParameters().get("step") === "your";
(async () => {
	if (!isOwnFaction) return;

	addXHRListener(({ detail: { page, xhr } }) => {
		if (page === "factions") {
			const params = new URLSearchParams(xhr.requestBody);
			const step = params.get("step");

			if (step === "crimes") {
				loadCrimes().then(() => {});
			} else if (step === "getMoneyDepositors") {
				triggerCustomListener(EVENT_CHANNELS.FACTION_GIVE_TO_USER);
			} else if (step === "upgradeConfirm") {
				if (document.find(".faction-tabs .ui-tabs-active").dataset.case !== "upgrades") return;
				triggerCustomListener(EVENT_CHANNELS.FACTION_UPGRADE_INFO);
			}
		}
	});

	await requireElement(".faction-tabs");

	document.find(".faction-tabs li[data-case=main]").addEventListener("click", loadMain);
	document.find(".faction-tabs li[data-case=info]").addEventListener("click", loadInfo);
	// document.find(".faction-tabs li[data-case=crimes]").addEventListener("click", loadCrimes);
	document.find(".faction-tabs li[data-case=armoury]").addEventListener("click", loadArmory);
	document.find(".faction-tabs li[data-case=controls]").addEventListener("click", loadControls);

	switch (getSubpage()) {
		case "main":
			loadMain().then(() => {});
			break;
		case "info":
			loadInfo().then(() => {});
			break;
		case "crimes":
			loadCrimes().then(() => {});
			break;
		case "armoury":
			loadArmory().then(() => {});
			break;
		case "controls":
			loadControls().then(() => {});
			break;
		default:
			break;
	}

	function getSubpage() {
		const hash = window.location.hash.replace("#/", "");
		return !hash || hash.includes("war/") ? "main" : getHashParameters().get("tab") || "";
	}

	async function loadMain() {
		await requireElement(".announcement");

		triggerCustomListener(EVENT_CHANNELS.FACTION_MAIN);
	}

	async function loadInfo() {
		await requireElement(".faction-description, .members-list");

		triggerCustomListener(EVENT_CHANNELS.FACTION_INFO);
	}

	async function loadCrimes() {
		await requireElement("#faction-crimes .crimes-list");

		triggerCustomListener(EVENT_CHANNELS.FACTION_CRIMES);
	}

	async function loadArmory() {
		await requireElement("#faction-armoury-tabs > ul.torn-tabs > li[aria-selected='true']");

		triggerCustomListener(EVENT_CHANNELS.FACTION_ARMORY_TAB, { section: getCurrentSection() });
		new MutationObserver((mutations) => {
			if (!mutations.some((mutation) => mutation.addedNodes.length > 5)) return;

			const mutation = mutations.find((mutation) => mutation.target.id.includes("armoury-"));
			if (!mutation) return;

			triggerCustomListener(EVENT_CHANNELS.FACTION_ARMORY_TAB, { section: mutation.target.id.replace("armoury-", "") });
		}).observe(document.find("#faction-armoury-tabs"), { childList: true, subtree: true });

		function getCurrentSection() {
			return document.find("#faction-armoury-tabs > ul.torn-tabs > li[aria-selected='true']").getAttribute("aria-controls").replace("armoury-", "");
		}
	}

	async function loadControls() {
		await requireElement(".control-tabs");

		const giveToUser = document.find(".control-tabs > li[aria-controls='option-give-to-user']");

		if (giveToUser) {
			checkGiveToUser();
			giveToUser.addEventListener("click", () => checkGiveToUser());
		}

		function checkGiveToUser() {
			if (document.find(".control-tabs > li[aria-controls='option-give-to-user']").getAttribute("aria-selected")) {
				triggerCustomListener(EVENT_CHANNELS.FACTION_GIVE_TO_USER);
			}
		}
	}
})();

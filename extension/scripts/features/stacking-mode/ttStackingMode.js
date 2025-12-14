"use strict";

(async () => {
	const currentPage = getPage();

	const feature = featureManager.registerFeature(
		"Stacking Mode",
		"global",
		() => settings.pages.global.stackingMode,
		registerListeners,
		disableUsage,
		enableUsage,
		{
			storage: ["settings.pages.global.stackingMode"],
		},
		null
	);

	function registerListeners() {
		if (currentPage === "hospital") {
			CUSTOM_LISTENERS[EVENT_CHANNELS.HOSPITAL_SWITCH_PAGE].push(disableReviving);
		}

		addFetchListener(async (event) => {
			if (!feature.enabled()) return;

			const { page, fetch } = event.detail;
			if (page !== "profiles") return;

			const step = new URL(fetch.url).searchParams.get("step");
			if (step !== "getUserNameContextMenu") return;

			const miniProfile = await requireElement("#profile-mini-root .mini-profile-wrapper");
			const attackButton = await requireElement(".profile-button-attack", { parent: miniProfile });
			attackButton.classList.add("tt-mouse-block");
			attackButton.appendChild(stackBlockSvg());

			if (miniProfile.find(".profile-container").classList.contains("hospital")) {
				const reviveButton = await requireElement(".profile-button-revive", { parent: miniProfile });
				reviveButton.classList.add("tt-mouse-block");
				reviveButton.appendChild(stackBlockSvg());
			}
		});
	}

	let hiddenDivs = [];
	async function disableUsage() {
		// Disable hunting link in sidebar, when abroad
		if (currentPage === "home" && document.body.dataset.country === "south-africa") {
			const huntingSidebar = await requireElement("#nav-hunting");
			hiddenDivs.push(huntingSidebar);
			huntingSidebar.classList.add("tt-hidden");
		}

		if (currentPage === "gym") {
			await disableSection("#gymroot");
		} else if (currentPage === "hunting") {
			await disableSection(".hunt");
		} else if (currentPage === "attack") {
			await disableSection("[class*='coreWrap__']");
		} else if (currentPage === "dump") {
			await disableSection(".dump-main-page");
		} else if (currentPage === "profiles") {
			// Disable attacking on profile page
			const attackBtn = await requireElement("#profileroot .profile-button-attack");
			attackBtn.classList.add("tt-mouse-block");
			attackBtn.appendChild(stackBlockSvg());

			const revBtn = await requireElement("#profileroot .profile-button-revive");
			revBtn.classList.add("tt-mouse-block");
			revBtn.appendChild(stackBlockSvg());
		} else if (currentPage === "hospital") {
			await disableReviving();
		} else if (currentPage === "abroad-people") {
			await disableAttacking();
		}

		function createBlock() {
			return document.newElement({
				type: "div",
				class: "tt-stack-block",
				children: [document.newElement({ type: "span", text: "TornTools - You've enabled stacking mode." })],
			});
		}

		async function disableSection(selector) {
			const section = await requireElement(selector);
			hiddenDivs.push(section);
			section.classList.add("tt-hidden");
			section.insertAdjacentElement("beforebegin", createBlock());
		}

		async function disableAttacking() {
			await requireElement(".users-list > li .attack");
			document.findAll(".users-list > li .attack").forEach((btn) => {
				btn.classList.add("tt-mouse-block");
				btn.appendChild(stackBlockSvg("tt-attack-block"));
			});
		}
	}

	async function disableReviving() {
		await requireElement(".user-info-list-wrap > li .user.name");
		document.findAll("a.revive:not(.reviveNotAvailable)").forEach((btn) => {
			btn.classList.add("tt-mouse-block");
			btn.appendChild(stackBlockSvg("tt-revive-block"));
		});
	}

	function stackBlockSvg(customClass) {
		const svg = crossSvg();
		svg.classList.add("tt-stacking");
		if (customClass) svg.classList.add(customClass);
		return svg;
	}

	function enableUsage() {
		hiddenDivs.forEach((x) => x.classList.remove("tt-hidden"));
		hiddenDivs = [];

		document.findAll(".tt-mouse-block").forEach((x) => x.classList.remove("tt-mouse-block"));
		document.findAll("#profile-mini-root .tt-cross, .tt-stacking, .tt-stack-block").forEach((x) => x.remove());
	}
})();

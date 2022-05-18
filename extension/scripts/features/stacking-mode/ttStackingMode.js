"use strict";

(async () => {
	const feature = featureManager.registerFeature(
		"Stacking Mode",
		"global",
		() => settings.pages.global.stackingMode,
		miniProfileListener,
		disableEActs,
		enableEActs,
		{
			storage: ["settings.pages.global.stackingMode"],
		},
		null
	);

	function miniProfileListener() {
		if (window.location.pathname === "/hospitalview.php") {
			CUSTOM_LISTENERS[EVENT_CHANNELS.HOSPITAL_SWITCH_PAGE].push(EVENT_CHANNELS.HOSPITAL_SWITCH_PAGE, disableReviving);
		}

		addFetchListener(async (event) => {
			if (!feature.enabled()) return;

			const { page, fetch } = event.detail;
			if (page !== "profiles") return;

			const step = (new URL(fetch.url).searchParams).get("step");
			if (step !== "getUserNameContextMenu") return;

			const miniProfile = await requireElement("#profile-mini-root .mini-profile-wrapper");
			const attackBtn = await requireElement(".profile-button-attack", { parent: miniProfile });
			attackBtn.classList.add("tt-mouse-block");
			attackBtn.appendChild(stackBlockSvg());

			if (miniProfile.find(".profile-container").classList.contains("hospital")) {
				const revBtn = await requireElement(".profile-button-revive", { parent: miniProfile });
				revBtn.classList.add("tt-mouse-block");
				revBtn.appendChild(stackBlockSvg());
			}
		});
	}

	let hiddenDivs = [];
	async function disableEActs() {
		const page = getPage();
		// Disable hunting link in sidebar, when abroad
		if (window.location.pathname === "/index.php" && document.body.dataset.country === "south-africa")
		{
			const huntingSidebar = await requireElement("#nav-hunting");
			hiddenDivs.push(huntingSidebar);
			huntingSidebar.classList.add("tt-hidden");
		}

		if (window.location.pathname === "/gym.php")
		{
			// Disable gyms
			const gymWrap = await requireElement("#gymroot");
			hiddenDivs.push(gymWrap);
			gymWrap.classList.add("tt-hidden");
			gymWrap.insertAdjacentElement("beforebegin", createBlock());
		}
		else if (window.location.pathname === "/index.php" && window.location.search.startsWith("?page=hunting"))
		{
			// Disable hunting page
			const huntingWrap = await requireElement(".hunt");
			hiddenDivs.push(huntingWrap);
			huntingWrap.classList.add("tt-hidden");
			huntingWrap.insertAdjacentElement("beforebegin", createBlock());
		}
		else if (window.location.pathname === "/loader.php" && window.location.search.startsWith("?sid=attack"))
		{
			// Disable attack page
			const attackWrap = await requireElement("[class*='coreWrap__']");
			hiddenDivs.push(attackWrap);
			attackWrap.classList.add("tt-hidden");
			attackWrap.insertAdjacentElement("beforebegin", createBlock());
		}
		else if (window.location.pathname === "/dump.php")
		{
			// Disable dump page
			const dumpWrap = await requireElement(".dump-main-page");
			hiddenDivs.push(dumpWrap);
			dumpWrap.classList.add("tt-hidden");
			dumpWrap.insertAdjacentElement("beforebegin", createBlock());
		}
		else if (window.location.pathname === "/profiles.php")
		{
			// Disable attacking on profile page
			const attackBtn = await requireElement("#profileroot .profile-button-attack");
			attackBtn.classList.add("tt-mouse-block");
			attackBtn.appendChild(stackBlockSvg());

			const revBtn = await requireElement("#profileroot .profile-button-revive");
			revBtn.classList.add("tt-mouse-block");
			revBtn.appendChild(stackBlockSvg());
		}
		else if (window.location.pathname === "/hospitalview.php")
		{
			disableReviving();
		} else if (page === "home" && window.location.search.startsWith("?page=people")) {
			disableAttacking();
		}

		function createBlock() {
			return document.newElement({
				type: "div",
				id: "tt-stack-block",
				children: [
					document.newElement({ type: "span", text: "TornTools - You've enabled stacking mode." })
				]
			});
		}
	}

	async function disableAttacking() {
		await requireElement(".users-list > li .attack");
		document.findAll(".users-list > li .attack").forEach(btn => {
			btn.classList.add("tt-mouse-block");
			btn.appendChild(stackBlockSvg("tt-attack-block"));
		});
	}

	async function disableReviving() {
		await requireElement(".user-info-list-wrap > li");
		document.findAll("a.revive:not(.reviveNotAvailable)").forEach(btn => {
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

	function enableEActs() {
		hiddenDivs.forEach(x => x.classList.remove("tt-hidden"));
		hiddenDivs = [];
		document.getElementById("tt-stack-block")?.remove();
		[...document.getElementsByClassName("tt-mouse-block")].forEach(x => x.classList.remove("tt-mouse-block"));
		document.findAll("#profile-mini-root .tt-cross, .tt-stacking").forEach(x => x.remove());
	}
})();

"use strict";

(async () => {
	if (!getPageStatus().access) return;

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
		addFetchListener(async (event) => {
			if (!feature.enabled()) return;

			const { page, fetch } = event.detail;
			if (page !== "profiles") return;

			const step = (new URL(fetch.url).searchParams).get("step");
			if (step !== "getUserNameContextMenu") return;

			const miniProfile = document.find("#profile-mini-root .mini-profile-wrapper");
			const attackBtn = await requireElement("div[class*='profile-mini-_userProfileWrapper___'] .profile-button-attack", { parent: miniProfile });
			attackBtn.classList.add("tt-mouse-block");
			attackBtn.appendChild(crossSvg());
		});
	}

	let hiddenDivs = [];
	async function disableEActs() {
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

	function enableEActs() {
		hiddenDivs.forEach(x => x.classList.remove("tt-hidden"));
		hiddenDivs = [];
		document.getElementById("tt-stack-block")?.remove();
		document.findAll(".tt-mouse-block").forEach(x => x.classList.remove("tt-mouse-block"));
		document.findAll("#profile-mini-root .tt-cross").forEach(x => x.remove());
	}
})();

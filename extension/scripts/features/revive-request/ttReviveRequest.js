"use strict";

(async () => {
	const devices = await checkDevice();
	if (devices.mobile || devices.tablet) return "Not supported on mobiles or tablets!";
	else if (isFlying()) return;

	const page = getPage();

	const feature = featureManager.registerFeature(
		"Revive Request",
		"global",
		() => settings.pages.global.reviveProvider,
		initialiseListeners,
		startFeature,
		removeButton,
		{
			storage: ["settings.pages.global.reviveProvider"],
		},
		() => {
			switch (settings.pages.global.reviveProvider) {
				case "nuke":
					if (!hasAPIData()) return "No API access.";
					break;
			}
		}
	);

	async function initialiseListeners() {
		new MutationObserver(() => {
			if (!feature.enabled()) return;

			if (isHospitalised()) showButton();
			else removeButton();
		}).observe(document.body, { attributes: true, attributeFilter: ["data-layout"] });

		if (page === "russianRoulette") {
			await requireElement("#react-root");

			new MutationObserver(() => {
				if (!isHospitalised()) return;

				showButton();
			}).observe(document.find("#react-root"), { childList: true });
		} else if (page === "forums") {
			await requireElement("#forums-page-wrap");

			new MutationObserver((mutations) => {
				if (
					!isHospitalised() ||
					![...mutations]
						.filter((mutation) => mutation.addedNodes.length)
						.flatMap((mutation) => [...mutation.addedNodes])
						.map((node) => node.className)
						.filter((name) => !!name)
						.some((name) => name.includes("content-title"))
				)
					return;

				showButton();
			}).observe(document.find("#forums-page-wrap"), { childList: true });
		}
	}

	function startFeature() {
		if (isHospitalised()) showButton();
		else removeButton();
	}

	function showButton() {
		removeButton();

		const button = document.newElement({
			type: "button",
			class: "tt-revive",
			children: [document.newElement({ type: "i", class: "fa-solid fa-stethoscope" }), document.newElement({ type: "span", text: "Request Revive" })],
			events: { click: requestRevive },
		});

		const parent = getParent();
		if (!parent) return;

		if (page === "item" && parent.id === "top-page-links-list") {
			parent.appendChild(button);
		} else {
			parent.insertAdjacentElement("beforebegin", button);
		}

		function getParent() {
			return (
				(page === "item" && document.find("#top-page-links-list")) ||
				document.find(".links-footer, .content-title .clear, .forums-main-wrap, [class*='linksContainer___']") ||
				document.find(".links-top-wrap")
			);
		}

		async function requestRevive() {
			const details = getUserDetails();
			if (details.error) return false; // TODO - Show error message.

			button.setAttribute("disabled", "");

			const { id, name } = details;
			const faction = getSidebar().statusIcons.icons.faction?.subtitle.split(" of ")[1] || "";

			let country = document.body.dataset.country;
			if (country === "uk") country = "United Kingdom";
			else if (country === "uae") country = "UAE";
			else country = capitalizeText(country.replaceAll("-", " "), { everyWord: true });

			doRequestRevive(id, name, country, faction)
				.then(() => displayMessage("Revive requested!"))
				.catch(({ provider, response }) => {
					displayMessage("Failed to request!", true);
					button.removeAttribute("disabled");
					console.log(`TT - Failed to request a revive with ${provider.name}!`, response);
				});
		}

		function getSidebar() {
			const key = Object.keys(sessionStorage).find((key) => /sidebarData\d+/.test(key));

			return JSON.parse(sessionStorage.getItem(key));
		}

		function displayMessage(message, error) {
			const element = button.find("span");
			element.textContent = message;
			if (!error) element.classList.add("tt-revive-success");

			setTimeout(() => {
				element.textContent = "Request Revive";
				element.classList.remove("tt-revive-success");
			}, 2500);
		}
	}

	function isHospitalised() {
		return document.body.dataset.layout === "hospital";
	}

	function removeButton() {
		document.find(".tt-revive")?.remove();
	}
})();

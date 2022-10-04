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
			storage: ["settings.pages.global.reviveProvider"]
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
			children: [document.newElement({
				type: "i",
				class: "fas fa-stethoscope"
			}), document.newElement({ type: "span", text: "Request Revive" })],
			events: { click: requestRevive }
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
			const provider = settings.pages.global.reviveProvider || "";

			const details = getUserDetails();
			if (details.error) return false; // TODO - Show error message.

			button.setAttribute("disabled", "");

			const { id, name } = details;
			const faction = getSidebar().statusIcons.icons.faction?.subtitle.split(" of ")[1] || "";

			let country = document.body.dataset.country;
			if (country === "uk") country = "United Kingdom";
			else if (country === "uae") country = "UAE";
			else country = capitalizeText(country.replaceAll("-", " "), { everyWord: true });

			const source = `TornTools v${chrome.runtime.getManifest().version}`;

			if (provider === "nuke") {
				const response = await fetchData("nukefamily", {
					section: "dev/reviveme.php",
					method: "POST",
					body: { uid: id, Player: name, Faction: faction, Country: country, AppInfo: source },
					relay: true,
					silent: true,
					succeedOnError: true
				});

				if (response.success) {
					displayMessage("Revive requested!");
				} else {
					displayMessage("Failed to request!", true);
					button.removeAttribute("disabled");
					console.log("TT - Failed to request a revive with Nuke!", response);
				}
			} else if (provider === "uhc") {
				const response = await fetchData("uhc", {
					section: "api/request",
					method: "POST",
					body: { userID: id, userName: name, factionName: faction, source },
					relay: true,
					silent: true,
					succeedOnError: true
				});

				if (response.success) {
					displayMessage("Revive requested!");
				} else {
					displayMessage("Failed to request!", true);
					button.removeAttribute("disabled");
					console.log("TT - Failed to request a revive with UHC!", response);
				}
			} else if (provider === "imperium") {
				const response = await fetchData("imperium", {
					section: "revive",
					method: "POST",
					body: { userID: id, userName: name, factionName: faction, source },
					relay: true,
					silent: true,
					succeedOnError: true
				});

				if (response.success) {
					displayMessage("Revive requested!");
				} else {
					displayMessage("Failed to request!", true);
					button.removeAttribute("disabled");
					console.log("TT - Failed to request a revive with Imperium!", response);
				}
			} else if (provider === "hela" || provider === "vinerri") {
				const providers = { "hela": "HeLa", "vinerri": "Vinerri" };
				const response = await fetchData(provider, {
					section: "request",
					method: "POST",
					body: {
						tornid: id.toString(),
						username: name,
						source: source,
						vendor: providers[provider],
						type: "revive"
					},
					relay: true,
					silent: true,
					succeedOnError: true
				});

				if (response.hasOwnProperty("contract")) {
					displayMessage((response["contract"] ? "Contract " : "") + " Revive requested!");
				} else {
					displayMessage("Failed to request!", true);
					button.removeAttribute("disabled");
					console.log("TT - Failed to request a revive with " + providers[provider] + "!", response);
				}
			} else {
				console.error("There was an attempt to request revives from an non-existing provider.", settings.pages.global.reviveProvider);
			}
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

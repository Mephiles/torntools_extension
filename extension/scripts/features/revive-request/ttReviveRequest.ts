(async () => {
	const devices = await checkDevice();
	if (devices.mobile || devices.tablet) return "Not supported on mobiles or tablets!";
	else if (isFlying()) return false;

	const page = getPage();

	const feature = featureManager.registerFeature(
		"Revive Request",
		"global",
		() => !!settings.pages.global.reviveProvider,
		initialiseListeners,
		startFeature,
		removeButton,
		{
			storage: ["settings.pages.global.reviveProvider"],
		},
		undefined
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
			}).observe(document.querySelector("#react-root"), { childList: true });
		} else if (page === "forums") {
			await requireElement("#forums-page-wrap");

			new MutationObserver((mutations) => {
				if (
					!isHospitalised() ||
					![...mutations]
						.filter((mutation) => mutation.addedNodes.length)
						.flatMap((mutation) => [...mutation.addedNodes])
						.filter(isElement)
						.map((node) => node.className)
						.filter((name) => !!name)
						.some((name) => name.includes("content-title"))
				)
					return;

				showButton();
			}).observe(document.querySelector("#forums-page-wrap"), { childList: true });
		}
	}

	function startFeature() {
		if (isHospitalised()) showButton();
		else removeButton();
	}

	function showButton() {
		removeButton();

		const button = elementBuilder({
			type: "button",
			class: "tt-revive",
			children: [elementBuilder({ type: "i", class: "fa-solid fa-stethoscope" }), elementBuilder({ type: "span", text: "Request Revive" })],
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
				(page === "item" && document.querySelector("#top-page-links-list")) ||
				document.querySelector(".links-footer, .content-title .clear, .forums-main-wrap, [class*='linksContainer___']") ||
				document.querySelector(".links-top-wrap")
			);
		}

		async function requestRevive() {
			const details = getUserDetails();
			if (details.error) return false; // TODO - Show error message.

			button.setAttribute("disabled", "");

			const { id, name } = details;
			const faction = getSidebarData().statusIcons.icons.faction?.subtitle.split(" of ")[1] || "";

			let country = document.body.dataset.country;
			if (country === "uk") country = "United Kingdom";
			else if (country === "uae") country = "UAE";
			else country = capitalizeText(country.replaceAll("-", " "), { everyWord: true });

			doRequestRevive(id.toString(), name, country, faction)
				.then(({ provider }) => displayMessage(`Revive requested for ${calculateRevivePrice(provider)}!`))
				.catch(({ provider, response }) => {
					if (response.code === "COOLDOWN") {
						displayMessage("Cooldown, wait for a little bit!", true);
						button.removeAttribute("disabled");
					} else {
						displayMessage("Failed to request!", true);
						button.removeAttribute("disabled");
						console.log(`TT - Failed to request a revive with ${provider.name}!`, response);
					}
				});
			return true;
		}

		function displayMessage(message: string, error: boolean = false) {
			const element = button.querySelector("span");
			element.textContent = message;
			if (!error) element.classList.add("tt-revive-success");

			setTimeout(() => {
				element.textContent = "Request Revive";
				element.classList.remove("tt-revive-success");
			}, 10 * TO_MILLIS.SECONDS);
		}
	}

	function isHospitalised() {
		return document.body.dataset.layout === "hospital";
	}

	function removeButton() {
		document.querySelector(".tt-revive")?.remove();
	}

	return true;
})();

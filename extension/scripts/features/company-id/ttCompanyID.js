"use strict";

(async () => {
	console.warn("test");
	if (!getPageStatus().access) return;

	const IDs = {
		company: null,
		player: null,
	};

	const feature = featureManager.registerFeature(
		"Company ID",
		"companies",
		() => settings.pages.companies.idBesideCompanyName,
		initialise,
		addID,
		removeID,
		{
			storage: ["settings.pages.companies.idBesideCompanyName"],
		},
		null
	);

	async function initialise() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.COMPANY_EMPLOYEES_PAGE].push(() => {
			if (!feature.enabled || !settings.pages.faction.idBesideFactionName) return;

			addID();
		});

		const hashes = getHashParameters();
		switch (true) {
			case isOwnCompany:
				return userdata.job.company_id ? (IDs.company = userdata.job.company_id) : (IDs.player = userdata.player_id);
			case document.location.pathname.toLowerCase() !== "/joblist.php":
				return false;
			case !hashes.get("p").toLowerCase() === "corpinfo":
				return false;
			case !isNaN(parseInt(hashes.get("ID"))):
				return (IDs.company = parseInt(hashes.get("ID")));
			case !isNaN(parseInt(hashes.get("userID"))):
				return (IDs.player = parseInt(hashes.get("userID")));
			default:
				return false;
		}
	}

	async function addID() {
		console.warn("addID", IDs);
		if (!IDs.company && !IDs.player) throw new Error("Neither Company nor User ID could be parsed from the URL.");
		if (isOwnCompany) {
			const [id, container] = await Promise.all([getID(), requireElement(".company-wrap > .title-black[role='heading']")]);
			container.textContent += ` [${id}]`;
		} else {
			const [id, container] = await Promise.all([getID(), requireElement(".company-details-wrap > .company-details")]);

			container.setAttribute("data-name", container.getAttribute("data-name") + ` [${id}]`);
			container.find(".m-hide").nextSibling.textContent += `[${id}] `;
		}
		async function getID() {
			if (!IDs.company && !IDs.player) throw "Neither Company nor User ID could be parsed from the URL.";
			if (IDs.company) return IDs.company;
			else return await fetchData("torn", { section: "user", selections: ["profile"], id: IDs.player }).then((j) => j.job.company_id);
		}
	}

	async function removeID() {
		console.warn("removeID", IDs);
		if (isOwnCompany) {
			const container = await requireElement(".company-wrap > .title-black[role='heading']");
			container.textContent = removeIDFromString(container.textContent);
		} else {
			const container = await requireElement(".company-details-wrap > .company-details");

			container.setAttribute("data-name", removeIDFromString(container.getAttribute("data-name")));
			const textNode = container.find(".m-hide").nextSibling;
			textNode.textContent = removeIDFromString(textNode.textContent);
		}

		function removeIDFromString(string) {
			const arr = string.split("[");
			arr.pop();
			return arr.join("[");
		}
	}
})();

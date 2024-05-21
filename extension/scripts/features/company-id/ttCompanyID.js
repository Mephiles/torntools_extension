"use strict";

(async () => {
	if (!getPageStatus().access) return;

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

	function initialise() {
		if (!isOwnCompany)
			CUSTOM_LISTENERS[EVENT_CHANNELS.COMPANY_EMPLOYEES_PAGE].push(() => {
				if (!feature.enabled() || !settings.pages.companies.idBesideCompanyName) return;

				addID();
			});
	}

	async function addID() {
		if (document.getElementById("tt-company-id")) return; // Element has already been added - second check in-case feature reinjects
		const selector = isOwnCompany ? "div.company-wrap > div.title-black" : "div.company-details-wrap > div.company-details > div.title-black";
		const [id, container] = await Promise.all([getCompanyID(), requireElement(selector)]);
		if (!id) throw new Error("Company ID could not be found.");
		const span = document.newElement({ type: "span", text: ` [${id}]`, id: "tt-company-id" });
		container.appendChild(span);
	}

	function removeID() {
		document.findAll("#tt-company-id").forEach((element) => element.remove());
	}

	async function getCompanyID() {
		if (isOwnCompany) {
			if (userdata.job.company_id) return userdata.job.company_id;
			const userID = userdata.player_id;
			if (!userID) return null; // ID could not be found
			return await getCompanyIDFromUser(userID);
		}

		const hashparams = getHashParameters();

		if (isIntNumber(hashparams.get("ID"))) return parseInt(hashparams.get("ID"));
		if (isIntNumber(hashparams.get("userID"))) return await getCompanyIDFromUser(parseInt(hashparams.get("userID")));

		return null; // ID could not be found

		async function getCompanyIDFromUser(userID) {
			const cached = ttCache.get("company-id", userID);
			if (cached) return cached;
			const data = await fetchData("torn", { section: "user", selections: ["profile"], id: userID });
			const companyID = data.job.company_id;
			ttCache.set({ [userID]: companyID }, 3.5 * TO_MILLIS.DAYS, "company-id");
			return companyID;
		}
	}
})();

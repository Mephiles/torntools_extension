(async () => {
	const feature = featureManager.registerFeature(
		"Display Case Worth",
		"display case",
		() => settings.pages.displayCase.worth,
		xhrListener,
		addWorth,
		removeWorth,
		{
			storage: ["settings.pages.displayCase.worth"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";

			return true;
		}
	);

	function xhrListener() {
		addXHRListener(({ detail: { page, xhr } }) => {
			if (feature.enabled() && page === "displaycase" && (xhr.requestBody === "step=display" || xhr.requestBody.startsWith("userID="))) addWorth();
		});
	}

	async function addWorth() {
		const displayCaseUserId = location.hash.split("/").length > 1 ? location.hash.split("/").last() : "";
		if (displayCaseUserId && !isNaN(parseInt(displayCaseUserId)) && parseInt(displayCaseUserId) !== userdata.profile.id) {
			await requireElement(".info-msg-cont .msg");
			// TODO - Migrate to V2 (user/display).
			fetchData("tornv2", { section: "user", id: displayCaseUserId, selections: ["display"], legacySelections: ["display"] })
				.then((result) => {
					let total = 0;

					for (const item of result.display) {
						total += item.market_price * item.quantity;
					}

					document.find(".info-msg-cont .msg").appendChild(
						document.newElement({
							type: "div",
							class: "tt-display-worth",
							text: "This display cabinet is worth ",
							children: [
								document.newElement({
									type: "span",
									text: formatNumber(total, { currency: true }) + ".",
								}),
							],
						})
					);
				})
				.catch((error) => {
					document.find(".info-msg-cont .msg").appendChild(
						document.newElement({
							type: "div",
							class: "tt-display-worth",
							text: "TORN API returned error:" + error.toString(),
						})
					);
					console.log("TT - Display Cabinet Worth API Error:", error);
				});
		} else {
			// TODO - Migrate to V2 (user/display).
			fetchData("tornv2", { section: "user", id: userdata.profile.id, selections: ["display"], legacySelections: ["display"] })
				.then(async (result) => {
					let total = 0;

					for (const item of result.display) {
						total += item.market_price * item.quantity;
					}

					document.find(".display-cabinet").insertAdjacentElement(
						"beforebegin",
						createMessageBox(`This display cabinet is worth <span>${formatNumber(total, { currency: true })}</span>.`, {
							class: "tt-display-worth",
							isHTML: true,
						})
					);
				})
				.catch(async (error) => {
					document
						.find(".display-cabinet")
						.insertAdjacentElement("beforebegin", createMessageBox(`TORN API returned error: ${error.toString()}.`, { class: "tt-display-worth" }));
					console.log("TT - Display Cabinet Worth API Error:", error);
				});
		}
	}

	function removeWorth() {
		document.find(".tt-display-worth").remove();
	}
})();

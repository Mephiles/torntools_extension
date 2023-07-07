"use strict";

(async () => {
	if (!getPageStatus().access) return;
	if (!isOwnFaction) return;

	const feature = featureManager.registerFeature(
		"Challenge Contributions to CSV",
		"faction",
		() => settings.pages.faction.csvChallengeContributions,
		addListener,
		addCSVContainer,
		removeCSVContainer,
		{
			storage: ["settings.pages.faction.csvChallengeContributions"],
		},
		null,
	);

	function addListener() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_UPGRADE_INFO].push(() => {
			if (feature.enabled()) addCSVContainer();
		});
	}

	async function addCSVContainer() {
		const descriptionWrap = await requireElement("#factions #faction-upgrades .body #stu-confirmation .description-wrap");
		const contributionsWrap = descriptionWrap.find(".contributions-wrap");
		if (!contributionsWrap) return;

		const exportButtonDiv = document.newElement({
			type: "div",
			id: "ttExportButton",
			children: [
				document.newElement({ type: "i", class: "fa fa-table" }),
				document.newElement({ type: "span", class: "text", text: "CSV" }),
				document.newElement({ type: "a", id: "ttExportLink" }),
			],
		});
		createContainer("Export Challenge Contributions", {
			nextElement: contributionsWrap,
			onlyHeader: true,
			applyRounding: false,
			collapsible: false,
		}).options.appendChild(exportButtonDiv);
		descriptionWrap.find("#ttExportButton").addEventListener("click", () => {
			const upgradeName = descriptionWrap.find("[role='alert'] .name").textContent;

			const csv = new CSVExport(`${upgradeName} Contributors`, descriptionWrap.find("#ttExportButton #ttExportLink"));
			csv.append(upgradeName);
			csv.append("Number", "Name", "Profile Link", "Ex Member", "Contributions");

			for (const row of contributionsWrap.findAll(".flexslides li:not(.slide)")) {
				const link = row.find(".player a");
				const name = link.getAttribute("aria-label");

				csv.append(
					row.find(".numb").textContent,
					name.match(/.*(?= \()/)[0],
					link.href,
					row.classList.contains("ex-member") ? "Yes" : "No",
					name.match(/(?<= \().*(?=\))/)[0],
				);
			}

			csv.download();
		});
	}

	function removeCSVContainer() {
		removeContainer("Export Challenge Contributions");
	}
})();

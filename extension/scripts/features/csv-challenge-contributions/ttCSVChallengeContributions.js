"use strict";

(async () => {
	if (!getPageStatus().access) return;

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
		null
	);

	function addListener() {
		addXHRListener(({ detail: { page, xhr, json } }) => {
			if (!json || !json.contributors || page !== "factions") return;
			if (feature.enabled()) addCSVContainer();
		});
	}

	async function addCSVContainer() {
		if (document.find(".faction-tabs .ui-tabs-active").dataset.case !== "upgrades") return;
		await requireElement("#factions #faction-upgrades .body #stu-confirmation .description-wrap");
			const descriptionWrap = document.find("#factions #faction-upgrades .body #stu-confirmation .description-wrap");
			const contributionsWrap = descriptionWrap.find(".contributions-wrap");
			if (
				!findContainer("Export Challenge Contributions") &&
				contributionsWrap
			) {
				const exportButtonDiv = document.newElement({
					type: "div",
					id: "ttExportButton",
					children: [
						document.newElement({ type: "i", class: "fa fa-table" }),
						document.newElement({ type: "span", class: "text", text: "CSV" }),
						document.newElement({ type: "a", id: "ttExportLink" }),
					]
				});
				createContainer(
					"Export Challenge Contributions",
					{
						nextElement: contributionsWrap,
						onlyHeader: true,
						applyRounding: false,
						collapsible: false
					}
				).options.appendChild(exportButtonDiv);
				descriptionWrap.find(
					"#ttExportButton"
				).addEventListener("click", () => {
					const upgradeName = descriptionWrap.find("[role='alert'] .name").innerText;
					let totalTable = "data:text/csv;charset=utf-8," + "Number;Name;Profile Link;Ex Member;Contributions\r\n" + upgradeName + "\r\n";
					contributionsWrap.findAll(".flexslides li:not(.slide)").forEach((memberLi) => {
						const memberName = memberLi.find(".player a");
						const memberLabel = memberName.ariaLabel;
						totalTable +=
							memberLi.find(".numb").innerText +
							";" +
							memberLabel.match(/.*(?= \()/)[0] +
							";" +
							memberName.href +
							";" +
							(memberLi.classList.contains("ex-member") ? "No" : "Yes") +
							";" +
							memberLabel.match(/(?<= \().*(?=\))/)[0] +
							"\r\n";
					})
					const ttExportLink = descriptionWrap.find("#ttExportButton #ttExportLink");
					ttExportLink.setAttribute("href", encodeURI(totalTable));
					ttExportLink.setAttribute("download", `${upgradeName} Contributors.csv`);
					ttExportLink.click();
				});
			}
	}

	function removeCSVContainer() {
		removeContainer("Export Challenge Contributions");
	}
})();

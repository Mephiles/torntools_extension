"use strict";

(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Ranked War Report to CSV",
		"faction",
		() => settings.pages.faction.csvRankedWarReport,
		null,
		addCSVContainer,
		removeCSVContainer,
		{
			storage: ["settings.pages.faction.csvRankedWarReport"],
		},
		null
	);

	async function addCSVContainer() {
		await requireElement(".faction-war");
		const { options } = createContainer("Ranked War Report", {
			previousElement: document.find(".content-wrapper .content-title"),
			onlyHeader: true,
		});
		const ttExportButton = document.newElement({
			type: "div",
			id: "ttExportButton",
			children: [
				document.newElement({ type: "i", class: "fa-solid fa-table" }),
				document.newElement({ type: "span", class: "text", text: "CSV" }),
				document.newElement({ type: "a", id: "ttExportLink" }),
			],
		});
		ttExportButton.addEventListener("click", () => {
			const rankID = getSearchParameters().get("rankID");
			const csv = new CSVExport(`Ranked War Report [${rankID}]`, options.find("#ttExportLink"));

			for (const selector of ["enemy", "your"]) {
				csv.append(document.find(`.faction-war .${selector} div[class*="text___"]`).textContent);
				csv.append("Members", "Level", "Attacks", "Score");

				const members = document.findAll(`.${selector}-faction .members-list > *[class]`);
				if (members.length) {
					for (const row of members) {
						csv.append(getUsername(row).combined, row.find(".level").textContent, row.find(".points").textContent, row.find(".status").textContent);
					}
				} else csv.append("None");
			}

			csv.download();
		});
		options.insertAdjacentElement("afterbegin", ttExportButton);
	}

	function removeCSVContainer() {
		removeContainer("Ranked War Report");
	}
})();

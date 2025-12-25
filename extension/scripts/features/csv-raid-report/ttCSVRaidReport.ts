(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Raid Report to CSV",
		"faction",
		() => settings.pages.faction.csvRaidReport,
		null,
		addCSVContainer,
		removeCSVContainer,
		{
			storage: ["settings.pages.faction.csvRaidReport"],
		},
		null
	);

	async function addCSVContainer() {
		await requireElement(".faction-war");
		const { options } = createContainer("Raid Report", {
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
			const raidID = getSearchParameters().get("raidID");
			const csv = new CSVExport(`Raid Report [${raidID}]`, options.find("#ttExportLink"));

			for (const selector of ["enemy", "your"]) {
				csv.append(document.find(`.faction-war .${selector} div[class*="text___"]`).textContent);
				csv.append("Members", "Level", "Attacks", "Damage");

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
		removeContainer("Raid Report");
	}
})();

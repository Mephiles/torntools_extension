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
			previousElement: document.querySelector(".content-wrapper .content-title"),
			onlyHeader: true,
		});
		const ttExportButton = elementBuilder({
			type: "div",
			id: "ttExportButton",
			children: [
				elementBuilder({ type: "i", class: "fa-solid fa-table" }),
				elementBuilder({ type: "span", class: "text", text: "CSV" }),
				elementBuilder({ type: "a", id: "ttExportLink" }),
			],
		});
		ttExportButton.addEventListener("click", () => {
			const raidID = getSearchParameters().get("raidID");
			const csv = new CSVExport(`Raid Report [${raidID}]`, options.querySelector("#ttExportLink"));

			for (const selector of ["enemy", "your"]) {
				csv.append(document.querySelector(`.faction-war .${selector} div[class*="text___"]`).textContent);
				csv.append("Members", "Level", "Attacks", "Damage");

				const members = findAllElements(`.${selector}-faction .members-list > *[class]`);
				if (members.length) {
					for (const row of members) {
						csv.append(
							getUsername(row).combined,
							row.querySelector(".level").textContent,
							row.querySelector(".points").textContent,
							row.querySelector(".status").textContent
						);
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

(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"War Report to CSV",
		"faction",
		() => settings.pages.faction.csvWarReport,
		null,
		addCSVContainer,
		removeCSVContainer,
		{
			storage: ["settings.pages.faction.csvWarReport"],
		},
		null
	);

	async function addCSVContainer() {
		await requireElement(".faction-war");
		const { options } = createContainer("War Report", {
			previousElement: document.find(".content-wrapper .content-title"),
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
			const warID = getSearchParameters().get("warID");
			const csv = new CSVExport(`War Report [${warID}]`, options.find("#ttExportLink"));

			for (const selector of ["enemy", "your"]) {
				csv.append(document.find(`.faction-war .${selector}`).textContent);
				csv.append("Members", "Level", "Points", "Joins", "Clears");

				const members = findAllElements(`.${selector}-faction .members-list > *[class]`);
				if (members.length) {
					for (const row of members) {
						csv.append(
							getUsername(row).combined,
							row.find(".lvl").textContent,
							row.find(".points").textContent,
							row.find(".joins").textContent,
							row.find(".knock-off").textContent
						);
					}
				} else csv.append("None");
			}

			csv.download();
		});
		options.insertAdjacentElement("afterbegin", ttExportButton);
	}

	function removeCSVContainer() {
		removeContainer("War Report");
	}
})();

(async () => {
	featureManager.registerFeature(
		"Chain Report to CSV",
		"faction",
		() => settings.pages.faction.csvChainReport,
		null,
		addCSVContainer,
		removeCSVContainer,
		{
			storage: ["settings.pages.faction.csvChainReport"],
		},
		null
	);

	async function addCSVContainer() {
		await requireElement(".members-stats-col.respect");
		const { options } = createContainer("Chain Report", {
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
			const chainID = getSearchParameters().get("chainID");
			const csv = new CSVExport(`Chain Report [${chainID}]`, options.find("#ttExportLink"));
			csv.append(document.find(".report-title-faction-name").textContent);
			csv.append("Members", "Respect", "Best", "Avg", "Attacks", "Leave", "Mug", "Hosp", "War", "Assist", "Retal", "Overseas", "Draw", "Escape", "Loss");

			const info = document.findAll(".members-stats-rows > *");
			document.findAll(".members-names-rows > *").forEach((member, index) => {
				csv.append(getUsername(member).combined, ...[...info[index].findAll(".members-stats-cols > *")].map((info) => info.textContent));
			});

			csv.download();
		});
		options.insertAdjacentElement("afterbegin", ttExportButton);
	}

	function removeCSVContainer() {
		removeContainer("Chain Report");
	}
})();

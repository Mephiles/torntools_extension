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
			const chainID = getSearchParameters().get("chainID");
			const csv = new CSVExport(`Chain Report [${chainID}]`, options.querySelector("#ttExportLink"));
			csv.append(document.querySelector(".report-title-faction-name").textContent);
			csv.append("Members", "Respect", "Best", "Avg", "Attacks", "Leave", "Mug", "Hosp", "War", "Assist", "Retal", "Overseas", "Draw", "Escape", "Loss");

			const info = findAllElements(".members-stats-rows > *");
			findAllElements(".members-names-rows > *").forEach((member, index) => {
				csv.append(getUsername(member).combined, ...findAllElements(".members-stats-cols > *", info[index]).map((info) => info.textContent));
			});

			csv.download();
		});
		options.insertAdjacentElement("afterbegin", ttExportButton);
	}

	function removeCSVContainer() {
		removeContainer("Chain Report");
	}
})();

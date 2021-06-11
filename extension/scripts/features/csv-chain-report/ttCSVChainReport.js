"use strict";

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
			html: `
				<i class="fa fa-table"></i>
				<span class="text">CSV</span>
				<a id="ttExportLink"></a>`,
		});
		ttExportButton.addEventListener("click", () => {
			let table = "data:text/csv;charset=utf-8,";
			table += document.find(".report-title-faction-name").innerText + "\r\n";
			table += "Members;Respect;Avg;Attacks;Leave;Mug;Hosp;War;Bonus;Assist;Retal;Overseas;Draw;Escape;Loss\r\n";
			const members = document.findAll(".members-names-rows > *");
			const info = document.findAll(".members-stats-rows > *");
			members.forEach((member, index) => {
				table += member.find(".user.name").dataset.placeholder + ";";
				const memberInfo = info[index];
				memberInfo.findAll(".members-stats-cols > *").forEach((infoItem) => table += infoItem.innerText + ";");
				table += "\r\n";
			});
			const chainID = getSearchParameters().get("chainID");
			const encodedUri = encodeURI(table);
			const ttExportLink = options.find("#ttExportLink");
			ttExportLink.setAttribute("href", encodedUri);
			ttExportLink.setAttribute("download", `Chain Report [${chainID}].csv`);
			ttExportLink.click();
		});
		options.insertAdjacentElement("afterbegin", ttExportButton);
	}

	function removeCSVContainer() {
		removeContainer("Chain Report");
	}
})();

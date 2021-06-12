"use strict";

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
			table += document.find(".faction-war .enemy").innerText + "\r\n";
			table += "Members;Level;Points;Joins;Clears\r\n";
			for (const memberRow of document.findAll(".enemy-faction .members-list > *")) {
				let totalRowString = "";
				totalRowString += memberRow.find(".user.name").dataset.placeholder.replace(" ", "") + ";";
				totalRowString += memberRow.find(".lvl").innerText + ";";
				totalRowString += memberRow.find(".points").innerText + ";";
				totalRowString += memberRow.find(".joins").innerText + ";";
				totalRowString += memberRow.find(".knock-off").innerText + ";";
				table += totalRowString + "\r\n";
			}
			table += document.find(".faction-war .your").innerText + "\r\n";
			table += "Members;Level;Points;Joins;Clears\r\n";
			for (const memberRow of document.findAll(".your-faction ul.members-list > *")) {
				let totalRowString = "";
				totalRowString += memberRow.find(".user.name").dataset.placeholder.replace(" ", "") + ";";
				totalRowString += memberRow.find(".lvl").innerText + ";";
				totalRowString += memberRow.find(".points").innerText + ";";
				totalRowString += memberRow.find(".joins").innerText + ";";
				totalRowString += memberRow.find(".knock-off").innerText + ";";
				table += totalRowString + "\r\n";
			}
			const warID = getSearchParameters().get("warID");
			const encodedUri = encodeURI(table);
			const ttExportLink = options.find("#ttExportLink");
			ttExportLink.setAttribute("href", encodedUri);
			ttExportLink.setAttribute("download", `War Report [${warID}].csv`);
			ttExportLink.click();
		});
		options.insertAdjacentElement("afterbegin", ttExportButton);
	}

	function removeCSVContainer() {
		removeContainer("War Report");
	}
})();

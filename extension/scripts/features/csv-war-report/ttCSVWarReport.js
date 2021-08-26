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
			children: [
				document.newElement({ type: "i", class: "fa fa-table" }),
				document.newElement({ type: "span", class: "text", text: "CSV" }),
				document.newElement({ type: "a", id: "ttExportLink" }),
			],
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

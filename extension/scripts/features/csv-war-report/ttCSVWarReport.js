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
			for (const selector of ["enemy", "your"]) {
				table += document.find(`.faction-war .${selector}`).textContent + "\r\n";
				table += "Members;Level;Points;Joins;Clears\r\n";
				const members = document.findAll(`.${selector}-faction .members-list > *`);
				if (members.length) {
					for (const memberRow of members) {
						let totalRowString = "";
						totalRowString += getUsername(memberRow) + ";";
						totalRowString += memberRow.find(".lvl").textContent + ";";
						totalRowString += memberRow.find(".points").textContent + ";";
						totalRowString += memberRow.find(".joins").textContent + ";";
						totalRowString += memberRow.find(".knock-off").textContent + ";";
						table += totalRowString + "\r\n";
					}
				} else table += "None\r\n";
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

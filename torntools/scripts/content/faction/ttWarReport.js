warReportLoaded().then(() => {
	console.log("TT - Faction | War Report");

	displayContainer();
});

function warReportLoaded() {
	return requireElement("div.faction-war");
}

function displayContainer() {
	const container = content.newContainer("Chain Report", { first: true, id: "ttChainReport", header_only: true, all_rounded: true });

	const option = document.new({
		type: "div",
		class: "tt-option",
		id: "ttExportButton",
		html: `
			<i class="fa fa-table"></i>
			<span class="text">CSV</span>
			<a id="ttExportLink" />`,
	});
	option.addEventListener("click", () => getTableAndExport(container));

	container.find(".tt-options").appendChild(option);
}

function getTableAndExport(container) {
	let table = "data:text/csv;charset=utf-8,";
	table += doc.find("span.enemy").innerText + "\r\n";
	table += "Members;Level;Points;Joins;Clears\r\n";
	for (let memberRow of doc.findAll("div.enemy-faction ul.members-list > *")) {
		let totalRowString = "";
		totalRowString += memberRow.find("a.user.name").getAttribute("data-placeholder").replace(" ", "") + ";";
		totalRowString += memberRow.find("div.lvl.left").innerText + ";";
		totalRowString += memberRow.find("div.points.left").innerText + ";";
		totalRowString += memberRow.find("div.joins.left").innerText + ";";
		totalRowString += memberRow.find("div.knock-off.left").innerText + ";";
		table += totalRowString + "\r\n";
	}
	table += doc.find("span.your").innerText + "\r\n";
	table += "Members;Level;Points;Joins;Clears\r\n";
	for (let memberRow of doc.findAll("div.your-faction ul.members-list > *")) {
		let totalRowString = "";
		totalRowString += memberRow.find("a.user.name").getAttribute("data-placeholder").replace(" ", "") + ";";
		totalRowString += memberRow.find("div.lvl.left").innerText + ";";
		totalRowString += memberRow.find("div.points.left").innerText + ";";
		totalRowString += memberRow.find("div.joins.left").innerText + ";";
		totalRowString += memberRow.find("div.knock-off.left").innerText + ";";
		table += totalRowString + "\r\n";
	}
	let war_id = getSearchParameters().get("warID");
	let encodedUri = encodeURI(table);
	container.find("#ttExportLink").setAttribute("href", encodedUri);
	container.find("#ttExportLink").setAttribute("download", `war_report_[${war_id}].csv`);
	container.find("#ttExportLink").click();
}

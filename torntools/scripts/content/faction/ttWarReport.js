warReportLoaded().then(() => {
	console.log("TT - Faction | War Report");

	displayContainer();
});

function warReportLoaded() {
	return requireElement("div.faction-war");
}

function displayContainer() {
	let options_container = content.newContainer("War Report", { first: true, id: "ttWarReport" });
	let export_btn = doc.new({
		type: "div",
		id: "ttExportTableButton",
		text: "Export Table to CSV",
	});
	let export_link = doc.new({
		type: "a",
		id: "ttExportLink",
	});

	options_container.find(".content").appendChild(export_btn);
	options_container.find(".content").appendChild(export_link);

	export_btn.addEventListener("click", () => {
		getTableAndExport();
	});
}

function getTableAndExport() {
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
	doc.find("#ttExportLink").setAttribute("href", encodedUri);
	doc.find("#ttExportLink").setAttribute("download", `war_report_[${war_id}].csv`);
	doc.find("#ttExportLink").click();
}

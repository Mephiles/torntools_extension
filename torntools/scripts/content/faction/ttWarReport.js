warReportLoaded().then(() => {
	console.log("TT - Faction | War Report");

	displayContainer();
});

function warReportLoaded() {
	return requireElement("div.faction-war");
}

function displayContainer() {
	let rawHTML = '<div id="ttWarReport"><div class="m-top10 tt-title title-green all-rounded"><div class="title-text">War Report</div><div class="tt-options"></div><i id="ttExportButton" class="tt-title-icon fa fa-table" style=""></i><span id="ttExportButton" class="tt-title title-text" style="padding-left: 2px;padding-right: 12px;font-size: larger;">CSV</span><a id="ttExportLink"></a></div></div>';

	doc.find(".content-title").insertAdjacentHTML("afterEnd", rawHTML);

	doc.find("#ttWarReport i#ttExportButton").addEventListener("click", () => {
		getTableAndExport();
	});
	doc.find("#ttWarReport span#ttExportButton").addEventListener("click", () => {
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

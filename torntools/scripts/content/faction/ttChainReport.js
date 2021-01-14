chainReportLoaded().then(() => {
	console.log("TT - Faction | Chain Report");

	displayContainer();
});

function chainReportLoaded() {
	return requireElement(".report-title");
}

function displayContainer() {
	let options_container = content.newContainer("Chain Report", { first: true, id: "ttChainReport" });

	let export_btn = doc.new("div");
	export_btn.id = "ttExportTableButton";
	export_btn.innerText = "Export Table to CSV";
	let export_link = doc.new("a");
	export_link.id = "ttExportLink";

	options_container.find(".content").appendChild(export_btn);
	options_container.find(".content").appendChild(export_link);

	export_btn.addEventListener("click", () => {
		let table = getData();
		let chain_id = doc.find("#chain-report-react-root .chain-report-wrap .title-black").innerText.split(" #")[1];
		exportData(table, chain_id);
	});
}

function getData() {
	let table = [];
	let rows = doc.findAll(".members-names-rows li");

	let headings = [
		"User",
		"Total Respect",
		"Average Respect",
		"Attacks",
		"Leaves",
		"Mugs",
		"Hosps",
		"War hits",
		"Bonus hits",
		"Assists",
		"Retaliation hits",
		"Overseas hits",
		"Draws",
		"Escapes",
		"Losses",
	];

	table.push(headings);

	for (let row of rows) {
		let table_row = [];
		let row_index = [...rows].indexOf(row) + 1;
		// console.log("row", row_index);

		for (let heading of headings) {
			if (heading === "User") {
				let user = row.find(".user.name").getAttribute("data-placeholder");
				table_row.push(user); // username + ID
				// console.log(user);
			} else {
				if (row.classList.contains("bg-gray")) {
					// didn't take part in chain
					table_row.push("-");
				} else {
					let column_index = headings.indexOf(heading);
					// console.log("column", column_index);

					table_row.push(doc.find(`.members-stats-rows li:nth-of-type(${row_index}) li:nth-of-type(${column_index})`).innerText);
				}
			}
		}

		table.push(table_row);
	}

	console.log("Table", table);
	return table;
}

function exportData(table, chain_id) {
	let csv = `data:text/csv;charset=utf-8,`;

	for (let row of table) {
		row = row.join(";");
		csv += row + "\r\n";
	}

	let encodedUri = encodeURI(csv);
	doc.find("#ttExportLink").setAttribute("href", encodedUri);
	doc.find("#ttExportLink").setAttribute("download", `chain_report_[${chain_id}].csv`);
	doc.find("#ttExportLink").click();
}

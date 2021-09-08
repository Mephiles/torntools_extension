class CSVExport {
	constructor(title, link) {
		this.title = title;
		this.link = link;

		this.rows = [];
	}

	get data() {
		const delimiter = settings.csvDelimiter || ";";

		return (
			"data:text/csv;charset=utf-8," +
			this.rows.map((row) => (Array.isArray(row) ? row.map((value) => `"${value}"`).join(delimiter) : `"${row}"`)).join("\r\n")
		);
	}

	append(...data) {
		this.rows.push(data);
	}

	download() {
		this.link.setAttribute("href", encodeURI(this.data));
		this.link.setAttribute("download", `${this.title}.csv`);
		this.link.click();
	}
}

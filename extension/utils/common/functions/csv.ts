import { settings } from "@/utils/common/data/database";
import { elementBuilder } from "@/utils/common/functions/dom";

export class CSVExport {
	private readonly title: string;
	private readonly rows: string[][];

	constructor(title: string) {
		this.title = title;

		this.rows = [];
	}

	get data() {
		const delimiter = settings.csvDelimiter || ";";

		return (
			"data:text/csv;charset=utf-8," +
			this.rows.map((row) => (Array.isArray(row) ? row.map((value) => `"${value}"`).join(delimiter) : `"${row}"`)).join("\r\n")
		);
	}

	append(...data: string[]) {
		this.rows.push(data);
	}

	download() {
		const link = elementBuilder({ type: "a" });
		link.setAttribute("href", encodeURI(this.data));
		link.setAttribute("download", `${this.title}.csv`);
		link.click();
	}
}

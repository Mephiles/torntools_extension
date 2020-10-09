requireDatabase().then(() => {
	requireElement(".content-wrapper > .delimiter-999").then(async () => {
		await showTable();
	});
});

async function showTable() {
	const result = (await fetchApi_v2("torn", { section: "torn", selections: "bank" })).bank;
	const balance = 2e9;

	const values = {
		w1: getValue("1w", balance),
		w2: getValue("2w", balance),
		m1: getValue("1m", balance),
		m2: getValue("2m", balance),
		m3: getValue("3m", balance),
	};
	const names = {
		w1: "1 Week",
		w2: "2 Weeks",
		m1: "1 Month",
		m2: "2 Months",
		m3: "3 Months",
	};

	let bestPeriod = Object.keys(values)[0];
	for (let period in values) {
		if (values[bestPeriod].standard.daily < values[period].standard.daily) bestPeriod = period;
	}

	let html = `
		<h1>2 billion investment</h1>
		<table>
			<thead>
				<tr>
					<th>Period</th>
					<th>No Merits</th>
					<th>No Merits + TCB</th>
					<th>10/10 Merits</th>
					<th>10/10 Merits + TCB</th>
				</tr>
			</thead>
			<tbody>
	`;
	for (let period in values) {
		html += `
			<tr class="${period === bestPeriod ? "best" : ""}">
				<td>${names[period]}</td>
				<td apr="${FORMATTER_PERCENTAGE.format(values[period].standard.apr)}%" rate="${FORMATTER_PERCENTAGE.format(values[period].standard.profitRate)}%">
					$${numberWithCommas(values[period].standard.total, false, FORMATTER_NO_DECIMALS)}
					<br/>
					<span>$${numberWithCommas(values[period].standard.daily, false, FORMATTER_NO_DECIMALS)}</span>
				</td>
				<td apr="${FORMATTER_PERCENTAGE.format(values[period].tcb.apr)}%" rate="${FORMATTER_PERCENTAGE.format(values[period].tcb.profitRate)}%">
					$${numberWithCommas(values[period].tcb.total, false, FORMATTER_NO_DECIMALS)}
					<br/>
					<span>$${numberWithCommas(values[period].tcb.daily, false, FORMATTER_NO_DECIMALS)}</span>
				</td>
				<td apr="${FORMATTER_PERCENTAGE.format(values[period].merit.apr)}%" rate="${FORMATTER_PERCENTAGE.format(values[period].merit.profitRate)}%">
					$${numberWithCommas(values[period].merit.total, false, FORMATTER_NO_DECIMALS)}
					<br/>
					<span>$${numberWithCommas(values[period].merit.daily, false, FORMATTER_NO_DECIMALS)}</span>
				</td>
				<td apr="${FORMATTER_PERCENTAGE.format(values[period].all.apr)}%" rate="${FORMATTER_PERCENTAGE.format(values[period].all.profitRate)}%">
					$${numberWithCommas(values[period].all.total, false, FORMATTER_NO_DECIMALS)}
					<br/>
					<span>$${numberWithCommas(values[period].all.daily, false, FORMATTER_NO_DECIMALS)}</span>
				</td>
			</tr>
		`;
	}
	html += "</tbody></table>";

	content
		.newContainer("Banking Investment", {
			id: "ttBank",
			adjacent_element: doc.find(".content-wrapper > .delimiter-999"),
		})
		.find(".content").innerHTML = html;

	function getValue(period, balance) {
		const DAYS = { "1w": 7, "2w": 14, "1m": 30, "2m": 60, "3m": 90 };
		const apr = (parseFloat(result[period]) * 100) / 10000;

		return {
			standard: calc(apr),
			tcb: calc(apr, 1.1),
			merit: calc(apr, 1.5),
			all: calc(apr, 1.65),
		};

		function calc(baseRate, boost = 1) {
			const apr = baseRate * boost;
			const profitRate = (apr / 365) * DAYS[period];

			return {
				total: profitRate.toFixed(4) * balance,
				daily: (profitRate.toFixed(4) * balance) / DAYS[period],
				apr: apr * 100,
				profitRate: profitRate * 100,
			};
		}
	}
}

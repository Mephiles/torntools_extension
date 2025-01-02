"use strict";

(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Bank Investment Info",
		"bank",
		() => settings.pages.bank.investmentInfo,
		null,
		initialize,
		teardown,
		{
			storage: ["settings.pages.bank.investmentInfo"],
		},
		null
	);

	const DAYS_IN_YEAR = 365;
	let balance = 2_000_000_000;
	const PERIOD_TYPE = {
		ONE_WEEK: "1w",
		TWO_WEEKS: "2w",
		ONE_MONTH: "1m",
		TWO_MONTHS: "2m",
		THREE_MONTHS: "3m",
	};
	const PERIOD_DESC = {
		[PERIOD_TYPE.ONE_WEEK]: "1 Week",
		[PERIOD_TYPE.TWO_WEEKS]: "2 Weeks",
		[PERIOD_TYPE.ONE_MONTH]: "1 Month",
		[PERIOD_TYPE.TWO_MONTHS]: "2 Months",
		[PERIOD_TYPE.THREE_MONTHS]: "3 Months",
	};
	const INVESTMENTS_BONUSES = {
		TCI: "tci",
		MERIT: "merit",
	};
	const DAYS = {
		[PERIOD_TYPE.ONE_WEEK]: 7,
		[PERIOD_TYPE.TWO_WEEKS]: 14,
		[PERIOD_TYPE.ONE_MONTH]: 30,
		[PERIOD_TYPE.TWO_MONTHS]: 60,
		[PERIOD_TYPE.THREE_MONTHS]: 90,
	};
	const BONUSES_RATIO = {
		[INVESTMENTS_BONUSES.TCI]: 0.1,
		[INVESTMENTS_BONUSES.MERIT]: 0.5,
	};
	let investmentTable, bestPeriod;

	function bankMoneyCellRenderer(bankMoneyData) {
		const element = document.newElement({
			type: "div",
			class: "bank-investment-money-cell-wrapper",
			children: [
				document.newElement({
					type: "div",
					class: "bank-investment-money-cell-total",
					text: formatNumber(bankMoneyData.total, { currency: true, decimals: 0 }),
				}),
				document.newElement({
					type: "div",
					class: "bank-investment-money-cell-per-day",
					text: formatNumber(bankMoneyData.daily, { currency: true, decimals: 0 }),
					attributes: { title: "Profit per day." },
				}),
			],
		});

		return {
			element,
			dispose: () => {},
		};
	}

	function createBankInvestmentContainer(bankAprInfo, delimiter) {
		const tableColumnsDefs = [
			{
				id: "period",
				title: "Period",
				width: 120,
				cellRenderer: "string",
			},
			{
				id: "regular",
				title: "Regular",
				width: 110,
				cellRenderer: "bankMoney",
			},
			{
				id: "tciOnly",
				title: "TCI Only",
				width: 110,
				cellRenderer: "bankMoney",
			},
			{
				id: "meritsOnly",
				title: "10/10 Merits Only",
				width: 115,
				cellRenderer: "bankMoney",
			},
			{
				id: "meritsAndTci",
				title: "10/10 Merits + TCI",
				width: 125,
				cellRenderer: "bankMoney",
			},
		];
		const tableRowsData = Object.values(PERIOD_TYPE).map((period) => _createRow(period));
		bestPeriod = tableRowsData.reduce((maxRow, row) => (row.regular.daily > maxRow.regular.daily ? row : maxRow), tableRowsData[0]).period;
		const customCellRenderers = {
			bankMoney: bankMoneyCellRenderer,
		};

		investmentTable = createTable(tableColumnsDefs, tableRowsData, {
			cellRenderers: customCellRenderers,
			rowClass: (rowData) => (rowData.period === bestPeriod ? "tt-bank-investment-selected-row" : ""),
			stretchColumns: true,
		});

		const moneyInput = document.newElement({
			type: "div",
			class: "tt-bank-investment-balance-input",
			children: [
				document.newElement({
					type: "label",
					text: "Amount: ",
					children: [
						document.newElement({
							type: "input",
							attributes: { type: "number", value: balance },
							events: {
								input: (e) => {
									balance = e.target.value.getNumber();
									updateInvestmentTable();
								},
							},
						}),
					],
				}),
			],
		});

		const { content, container } = createContainer("Bank Investment", { previousElement: delimiter });
		content.appendChild(moneyInput);
		content.appendChild(investmentTable.element);

		function dispose() {
			investmentTable.dispose();
			container.remove();
		}

		function _createRow(period) {
			return {
				period: PERIOD_DESC[period],
				regular: _getMoneyInfo(period, []),
				tciOnly: _getMoneyInfo(period, [INVESTMENTS_BONUSES.TCI]),
				meritsOnly: _getMoneyInfo(period, [INVESTMENTS_BONUSES.MERIT]),
				meritsAndTci: _getMoneyInfo(period, [INVESTMENTS_BONUSES.TCI, INVESTMENTS_BONUSES.MERIT]),
			};
		}

		function _getMoneyInfo(period, bonuses) {
			const apr = parseFloat(bankAprInfo[period]);
			const aprPercent = apr / 100;
			const totalBonusRatio = bonuses.reduce((total, bonus) => total * (1 + BONUSES_RATIO[bonus]), 1);
			const aprWithBonus = aprPercent * totalBonusRatio;
			const profitPerDayRatio = (aprWithBonus / DAYS_IN_YEAR) * DAYS[period];

			const total = (profitPerDayRatio.toFixed(4) * balance).roundNearest(1);
			const daily = (total / DAYS[period]).toFixed();

			return {
				total,
				daily,
			};
		}

		function updateInvestmentTable() {
			const tableRowsData = Object.values(PERIOD_TYPE).map((period) => _createRow(period));
			bestPeriod = tableRowsData.reduce((maxRow, row) => (row.regular.daily > maxRow.regular.daily ? row : maxRow), tableRowsData[0]).period;
			investmentTable.updateData(tableRowsData);
		}

		return {
			dispose,
		};
	}

	let bankInvestmentInfoContainer;

	async function initialize() {
		const delimiter = await requireElement(".content-wrapper > .delimiter-999");

		let response;
		if (ttCache.hasValue("bankInterest")) {
			response = ttCache.get("bankInterest");
		} else {
			response = (await fetchData("torn", { section: "torn", selections: ["bank"] })).bank;

			ttCache.set({ bankInterest: response }, millisToNewDay()).then(() => {});
		}

		bankInvestmentInfoContainer = createBankInvestmentContainer(response, delimiter);
	}

	function teardown() {
		bankInvestmentInfoContainer?.dispose();
		bankInvestmentInfoContainer = undefined;
	}
})();

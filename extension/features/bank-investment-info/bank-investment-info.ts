import "./bank-investment-info.css";
import { Feature } from "@/features/feature-manager";
import { ttCache } from "@/utils/common/data/cache";
import { settings } from "@/utils/common/data/database";
import type { BaseElement } from "@/utils/common/elements/base-element";
import { createTable, stringCellRenderer, type TableColumnDef, type TableElement } from "@/utils/common/elements/table/table";
import { fetchData } from "@/utils/common/functions/api";
import type { TornV1Bank, TornV1BankResponse } from "@/utils/common/functions/api-v1.types";
import { createContainer } from "@/utils/common/functions/containers";
import { elementBuilder } from "@/utils/common/functions/dom";
import { formatNumber, roundNearest } from "@/utils/common/functions/formatting";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus, millisToNewDay } from "@/utils/common/functions/torn";

interface MoneyInfo {
	total: number;
	daily: number;
}

interface BankTableRowData {
	period: string;
	regular: MoneyInfo;
	tciOnly: MoneyInfo;
	meritsOnly: MoneyInfo;
	meritsAndTci: MoneyInfo;
}

const DAYS_IN_YEAR = 365;
let balance = 2_000_000_000;
const PERIOD_TYPE = {
	ONE_WEEK: "1w",
	TWO_WEEKS: "2w",
	ONE_MONTH: "1m",
	TWO_MONTHS: "2m",
	THREE_MONTHS: "3m",
} as const;
type PERIOD_TYPE = (typeof PERIOD_TYPE)[keyof typeof PERIOD_TYPE];
const PERIOD_DESC: Record<PERIOD_TYPE, string> = {
	[PERIOD_TYPE.ONE_WEEK]: "1 Week",
	[PERIOD_TYPE.TWO_WEEKS]: "2 Weeks",
	[PERIOD_TYPE.ONE_MONTH]: "1 Month",
	[PERIOD_TYPE.TWO_MONTHS]: "2 Months",
	[PERIOD_TYPE.THREE_MONTHS]: "3 Months",
};
const INVESTMENTS_BONUSES = {
	TCI: "tci",
	MERIT: "merit",
} as const;
type INVESTMENTS_BONUSES = (typeof INVESTMENTS_BONUSES)[keyof typeof INVESTMENTS_BONUSES];
const DAYS: Record<PERIOD_TYPE, number> = {
	[PERIOD_TYPE.ONE_WEEK]: 7,
	[PERIOD_TYPE.TWO_WEEKS]: 14,
	[PERIOD_TYPE.ONE_MONTH]: 30,
	[PERIOD_TYPE.TWO_MONTHS]: 60,
	[PERIOD_TYPE.THREE_MONTHS]: 90,
};
const BONUSES_RATIO: Record<INVESTMENTS_BONUSES, number> = {
	[INVESTMENTS_BONUSES.TCI]: 0.1,
	[INVESTMENTS_BONUSES.MERIT]: 0.5,
};
let investmentTable: TableElement<BankTableRowData>, bestPeriod: string;

function bankMoneyCellRenderer(bankMoneyData: MoneyInfo): BaseElement {
	const element = elementBuilder({
		type: "div",
		class: "bank-investment-money-cell-wrapper",
		children: [
			elementBuilder({
				type: "div",
				class: "bank-investment-money-cell-total",
				text: formatNumber(bankMoneyData.total, { currency: true }),
			}),
			elementBuilder({
				type: "div",
				class: "bank-investment-money-cell-per-day",
				text: formatNumber(bankMoneyData.daily, { currency: true }),
				attributes: { title: "Profit per day." },
			}),
		],
	});

	return {
		element,
		dispose: () => {},
	};
}

interface BankInvestmentContainer {
	dispose: () => void;
}

function createBankInvestmentContainer(bankAprInfo: any, delimiter: HTMLElement): BankInvestmentContainer {
	const tableColumnsDefs: TableColumnDef<BankTableRowData>[] = [
		{
			id: "period",
			title: "Period",
			width: 120,
			sortable: false,
			cellRenderer: stringCellRenderer,
		},
		{
			id: "regular",
			title: "Regular",
			width: 110,
			sortable: false,
			cellRenderer: bankMoneyCellRenderer,
		},
		{
			id: "tciOnly",
			title: "TCI Only",
			width: 110,
			sortable: false,
			cellRenderer: bankMoneyCellRenderer,
		},
		{
			id: "meritsOnly",
			title: "10/10 Merits Only",
			width: 115,
			sortable: false,
			cellRenderer: bankMoneyCellRenderer,
		},
		{
			id: "meritsAndTci",
			title: "10/10 Merits + TCI",
			width: 125,
			sortable: false,
			cellRenderer: bankMoneyCellRenderer,
		},
	];
	const tableRowsData = Object.values(PERIOD_TYPE).map((period) => _createRow(period));
	bestPeriod = tableRowsData.reduce((maxRow, row) => (row.regular.daily > maxRow.regular.daily ? row : maxRow), tableRowsData[0]).period;

	investmentTable = createTable(tableColumnsDefs, tableRowsData, {
		rowClass: (rowData) => (rowData.period === bestPeriod ? "tt-bank-investment-selected-row" : ""),
		stretchColumns: true,
	});

	const moneyInput = elementBuilder({
		type: "div",
		class: "tt-bank-investment-balance-input",
		children: [
			elementBuilder({
				type: "label",
				text: "Amount: ",
				children: [
					elementBuilder({
						type: "input",
						attributes: { type: "number", value: balance.toString() },
						events: {
							input: (e) => {
								balance = (e.target as HTMLInputElement).valueAsNumber;
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

	function _createRow(period: PERIOD_TYPE): BankTableRowData {
		return {
			period: PERIOD_DESC[period],
			regular: _getMoneyInfo(period, []),
			tciOnly: _getMoneyInfo(period, [INVESTMENTS_BONUSES.TCI]),
			meritsOnly: _getMoneyInfo(period, [INVESTMENTS_BONUSES.MERIT]),
			meritsAndTci: _getMoneyInfo(period, [INVESTMENTS_BONUSES.TCI, INVESTMENTS_BONUSES.MERIT]),
		};
	}

	function _getMoneyInfo(period: PERIOD_TYPE, bonuses: INVESTMENTS_BONUSES[]): MoneyInfo {
		const apr = parseFloat(bankAprInfo[period]);
		const aprPercent = apr / 100;
		const totalBonusRatio = bonuses.reduce((total, bonus) => total * (1 + BONUSES_RATIO[bonus]), 1);
		const aprWithBonus = aprPercent * totalBonusRatio;
		const profitPerDayRatio = (aprWithBonus / DAYS_IN_YEAR) * DAYS[period];

		const total = roundNearest(+profitPerDayRatio.toFixed(4) * balance, 1);
		const daily = +(total / DAYS[period]).toFixed();

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

let bankInvestmentInfoContainer: BankInvestmentContainer;

async function initialize() {
	const delimiter = await requireElement(".content-wrapper > .delimiter-999");

	let response: TornV1Bank;
	if (ttCache.hasValue("bankInterest")) {
		response = ttCache.get("bankInterest");
	} else {
		// TODO - Migrate to V2 (torn/bank).
		response = (await fetchData<TornV1BankResponse>("tornv2", { section: "torn", selections: ["bank"], legacySelections: ["bank"] })).bank;

		ttCache.set({ bankInterest: response }, millisToNewDay()).then(() => {});
	}

	bankInvestmentInfoContainer = createBankInvestmentContainer(response, delimiter);
}

function teardown() {
	bankInvestmentInfoContainer?.dispose();
	bankInvestmentInfoContainer = undefined;
}

export default class BankInvestmentInfoFeature extends Feature {
	constructor() {
		super("Bank Investment Info", "bank");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.bank.investmentInfo;
	}

	async execute() {
		await initialize();
	}

	cleanup() {
		teardown();
	}

	storageKeys() {
		return ["settings.pages.bank.investmentInfo"];
	}
}

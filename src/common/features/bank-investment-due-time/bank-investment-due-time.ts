import { settings, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { elementBuilder } from "@common/utils/functions/dom";
import { formatDate, formatTime } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

function createBankInvestmentFacade(investmentTimeLeftElement: Element) {
	if (userdata.money.city_bank === null) return { dispose: () => {} };

	const dueDate = new Date(userdata.money.city_bank.until * 1000);
	const formattedDate = formatDate(dueDate, { showYear: true });
	const formattedTime = formatTime(dueDate);
	const formatted = `${formattedDate} ${formattedTime}`;

	const investmentDueTimeElement = elementBuilder({
		type: "span",
		children: [
			document.createTextNode("Investment will be completed on "),
			elementBuilder({
				type: "b",
				text: formatted,
			}),
		],
	});

	investmentTimeLeftElement.insertAdjacentElement("afterend", investmentDueTimeElement);
}

export default class BankInvestmentDueTimeFeature extends Feature {
	constructor() {
		super("Bank Investment Due Time", "bank");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.bank.investmentDueTime;
	}

	override requirements() {
		if (!hasAPIData() || !settings.apiUsage.user.money) return "No API access.";
		else if (!userdata.money.city_bank?.until) return "No active investment.";

		return true;
	}

	override async execute() {
		createBankInvestmentFacade(await requireElement("p.m-clear"));
	}

	override storageKeys() {
		return ["settings.pages.bank.investmentDueTime", "userdata.money.city_bank.until"];
	}
}

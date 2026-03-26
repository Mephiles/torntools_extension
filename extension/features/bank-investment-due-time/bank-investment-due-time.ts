import { Feature } from "@/features/feature-manager";
import { getPageStatus } from "@/utils/common/functions/torn";
import { hasAPIData } from "@/utils/common/functions/api";
import { settings, userdata } from "@/utils/common/data/database";
import { elementBuilder } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";
import { formatDate, formatTime } from "@/utils/common/functions/formatting";

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

	function dispose() {
		investmentDueTimeElement.remove();
	}

	return {
		dispose,
	};
}

let bankInvestmentFacade: ReturnType<typeof createBankInvestmentFacade> | undefined;

export default class BankInvestmentDueTimeFeature extends Feature {
	constructor() {
		super("Bank Investment Due Time", "bank");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.bank.investmentDueTime;
	}

	requirements() {
		if (!hasAPIData() || !settings.apiUsage.user.money) return "No API access.";
		else if (!userdata.money.city_bank.until) return "No active investment.";

		return true;
	}

	async execute() {
		bankInvestmentFacade = createBankInvestmentFacade(await requireElement("p.m-clear"));
	}

	cleanup() {
		bankInvestmentFacade?.dispose();
		bankInvestmentFacade = undefined;
	}

	storageKeys() {
		return ["settings.pages.bank.investmentDueTime", "userdata.money.city_bank.until"];
	}
}

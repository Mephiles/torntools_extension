import { settings } from "@common/utils/data/database";
import { getSearchParameters } from "@common/utils/functions/dom";
import { requireElement } from "@common/utils/functions/requires";
import { getPage, updateReactInput } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

function handleFilledUrl() {
	const page = getPage();
	const params = getSearchParameters();

	if (page === "profiles" && params.has("send-money")) {
		const money = parseInt(params.get("send-money"));
		const message = params.get("send-money-message");

		void prefillSendMoney(money, message);
	}
}

async function prefillSendMoney(amount: number, message: string) {
	const moneyButton = await requireElement(".profile-button-sendMoney");
	moneyButton.click();

	await requireElement(".input-money");
	updateReactInput(document.querySelector<HTMLInputElement>(".input-money"), amount);
	updateReactInput(document.querySelector<HTMLInputElement>(".send-cash-message-input"), message);
}

export default class UrlFillFeature extends Feature {
	constructor() {
		super("URL Fill", "global");
	}

	isEnabled(): boolean {
		return settings.pages.global.urlFill;
	}

	async execute() {
		handleFilledUrl();
	}

	storageKeys(): string[] {
		return ["settings.pages.global.urlFill"];
	}
}

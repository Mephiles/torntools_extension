import { isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { findAllElements, getHashParameters } from "@common/utils/functions/dom.ts";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { convertToNumber } from "@common/utils/functions/formatting.ts";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import styles from "./balance-warning.module.css";

const acceptedWarnings = new Set<string>();
let formObserver: MutationObserver | undefined;

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.FACTION_GIVE_TO_USER_PAGE, () => {
		if (!FEATURE_MANAGER.isEnabled(BalanceWarningFeature)) return;

		pageLoad();
	});
}

function pageLoad() {
	formObserver?.disconnect();
	formObserver = undefined;

	interceptGiveMoneyClick();

	const form = document.querySelector<HTMLElement>("#faction-give-to-user-root [class*='money___'] form");
	if (!form) return;

	formObserver = new MutationObserver((mutations) => {
		if (!mutations.some((mutation) => mutation.addedNodes.length)) return;

		interceptGiveMoneyClick();
	});
	formObserver.observe(form, { childList: true });
}

function interceptGiveMoneyClick() {
	const giveMoneyButton = document.querySelector<HTMLElement>(
		`#faction-give-to-user-root [class*='money___'] [class*='ctaButton___']:not(.${styles.balanceWarningIntercepted})`,
	);
	if (!giveMoneyButton) return;

	giveMoneyButton.classList.add(styles.balanceWarningIntercepted);
	giveMoneyButton.addEventListener("click", giveMoneyHandler);
}

function giveMoneyHandler(event: MouseEvent) {
	const inputValues = getGiveMoneyInputs();
	if (!inputValues) return;

	if (!document.querySelector<HTMLInputElement>("#give-money")?.checked) return;

	const { user, money } = inputValues;
	if (allowFromPersonalBalance(user, money) || matchesAnyBalance(money)) return;

	if (acceptedWarnings.has(`${user}-${money}`)) return;

	event.preventDefault();
	event.stopPropagation();

	const accepted = showWarning();
	if (!accepted) return;

	acceptedWarnings.add(`${user}-${money}`);
}

interface GiveMoneyInputs {
	user: number;
	money: number;
}

function getGiveMoneyInputs(): GiveMoneyInputs | null {
	const moneyRoot = moneyRootElement();
	if (!moneyRoot) return null;

	const moneyInput = moneyRoot.querySelector<HTMLInputElement>(".input-money[type='hidden']");
	if (!moneyInput?.value) return null;

	const userInput = moneyRoot.querySelector<HTMLInputElement>("[class*='userAutocomplete___']");
	if (!userInput?.value) return null;

	const userMatch = userInput.value.match(/.*\[(\d+)]/);
	if (!userMatch) return null;

	const money = parseInt(moneyInput.value);
	const user = parseInt(userMatch[1]);

	return { user, money };
}

function allowFromPersonalBalance(userId: number, amount: number): boolean {
	const userRow = document.querySelector(`#faction-give-to-user-root [class*='money___'] li:has(a[href$='XID=${userId}'])`);
	if (!userRow) return false;

	const balanceElement = userRow.querySelector<HTMLElement>("[class*='editBalanceWrap___']");
	if (!balanceElement) return false;

	return convertToNumber(balanceElement.textContent) >= amount;
}

function matchesAnyBalance(amount: number): boolean {
	return findAllElements("#faction-give-to-user-root [class*='money___'] li [class*='editBalanceWrap___']").some(
		(balanceElement) => convertToNumber(balanceElement.textContent) === amount,
	);
}

function showWarning() {
	return confirm("You are giving more than the balance of this user, and doesn't match any other balance either.");
}
function moneyRootElement() {
	return document.querySelector("#faction-give-to-user-root [class*='money___']");
}

export default class BalanceWarningFeature extends Feature {
	constructor() {
		super("Balance Warning", "faction");
	}

	override precondition() {
		return getPageStatus().access && isInternalFaction;
	}

	override isEnabled() {
		return settings.pages.faction.balanceWarning;
	}

	override initialise() {
		initialiseListeners();
	}

	override execute() {
		const params = getHashParameters();
		if (params.get("tab") !== "controls") return;
		if (params.has("option") && params.get("option") !== "give-to-user") return;

		pageLoad();
	}

	override storageKeys() {
		return ["settings.pages.faction.balanceWarning"];
	}
}

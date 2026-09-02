import { isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { getHashParameters } from "@common/utils/functions/dom.ts";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements.ts";
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

	const form = findElement("#faction-give-to-user-root [class*='money___'] form", true);
	if (!form) return;

	formObserver = new MutationObserver((mutations) => {
		if (!mutations.some((mutation) => mutation.addedNodes.length)) return;

		interceptGiveMoneyClick();
	});
	formObserver.observe(form, { childList: true });
}

function interceptGiveMoneyClick() {
	const giveMoneyButton = findElement(
		`#faction-give-to-user-root [class*='money___'] [class*='ctaButton___']:not(.${styles.balanceWarningIntercepted})`,
		true,
	);
	if (!giveMoneyButton) return;

	giveMoneyButton.classList.add(styles.balanceWarningIntercepted);
	giveMoneyButton.addEventListener("click", giveMoneyHandler);
}

function giveMoneyHandler(event: MouseEvent) {
	const inputValues = getGiveMoneyInputs();
	if (!inputValues) return;

	if (!findElement<HTMLInputElement>("#give-money", true)?.checked) return;

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

	const moneyInput = findElement<HTMLInputElement>(".input-money[type='hidden']", moneyRoot, true);
	if (!moneyInput?.value) return null;

	const userInput = findElement<HTMLInputElement>("[class*='userAutocomplete___']", moneyRoot, true);
	if (!userInput?.value) return null;

	const userMatch = userInput.value.match(/.*\[(\d+)]/);
	if (!userMatch) return null;

	const money = parseInt(moneyInput.value);
	const user = parseInt(userMatch[1]);

	return { user, money };
}

function allowFromPersonalBalance(userId: number, amount: number): boolean {
	const userRow = findElement(`#faction-give-to-user-root [class*='money___'] li:has(a[href$='XID=${userId}'])`, true);
	if (!userRow) return false;

	const balanceElement = findElement("[class*='editBalanceWrap___']", userRow, true);
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
	return findElement("#faction-give-to-user-root [class*='money___']", true);
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

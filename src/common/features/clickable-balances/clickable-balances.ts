import { isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { findAllElements, getHashParameters, isHTMLElement } from "@common/utils/functions/dom.ts";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { convertToNumber } from "@common/utils/functions/formatting.ts";
import { getPageStatus, getUsername, updateReactInput } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import styles from "./clickable-balances.module.css";

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.FACTION_GIVE_TO_USER_PAGE, () => {
		if (!FEATURE_MANAGER.isEnabled(ClickableBalancesFeature)) return;

		makeBalancesClickable();
	});
}

function makeBalancesClickable() {
	findAllElements(
		`#faction-give-to-user-root [class*='money___'] [class*='userListWrap___'] [class*='listItem___']:not(.${styles.clickableBalanceWrapper})`,
	).forEach((row) => {
		const balanceElement = row.querySelector<HTMLElement>("[class*='editBalanceWrap___']");
		if (!balanceElement) return;

		row.classList.add(styles.clickableBalanceWrapper);
		balanceElement.classList.add(styles.clickableBalance);
		balanceElement.addEventListener("click", fillClickedBalance);
	});
}

function fillClickedBalance(event: MouseEvent) {
	const balanceElement = event.currentTarget!;
	if (!isHTMLElement(balanceElement)) return;

	const row = balanceElement.closest("li");
	if (!row) return;

	const user = getUsername(row);
	const balance = convertToNumber(balanceElement.textContent);
	const activeMember = !row.querySelector("[class*='inactive___']");

	fillBalance(user.combined, balance, activeMember);
}

function removeClickableBalances() {
	findAllElements(`.${styles.clickableBalanceWrapper}`).forEach((row) => row.classList.remove(styles.clickableBalanceWrapper));
	findAllElements(`.${styles.clickableBalance}`).forEach((balanceElement) => {
		balanceElement.classList.remove(styles.clickableBalance);
		balanceElement.removeEventListener("click", fillClickedBalance);
	});
}

function fillBalance(user: string, amount: number, activeMember: boolean) {
	const moneyRoot = moneyRootElement();
	if (!moneyRoot) {
		console.warn(`TT - Failed to fill the balance for ${user} with ${amount} because we didn't find the money root.`);
		return;
	}

	const moneyInput = moneyRoot.querySelector<HTMLInputElement>(".input-money:not([type='hidden'])");
	if (!moneyInput) {
		console.warn(`TT - Failed to fill the balance for ${user} with ${amount} because we didn't find the money input.`);
		return;
	}

	const userInput = moneyRoot.querySelector<HTMLInputElement>("[class*='userAutocomplete___']");
	if (!userInput) {
		console.warn(`TT - Failed to fill the balance for ${user} with ${amount} because we didn't find the user input.`);
		return;
	}

	moneyRoot.querySelector("[class*='userAutocomplete___']")?.classList.toggle("error", !activeMember);

	updateReactInput(moneyInput, amount.toString());
	updateReactInput(userInput, user);
	// Updating the input opens the autocomplete modal, close it immediately.
	userInput.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
}

function moneyRootElement() {
	return document.querySelector("#faction-give-to-user-root [class*='money___']");
}

export default class ClickableBalancesFeature extends Feature {
	constructor() {
		super("Clickable Balances", "faction");
	}

	precondition() {
		return getPageStatus().access && isInternalFaction;
	}

	isEnabled() {
		return settings.pages.faction.clickableBalances;
	}

	initialise() {
		initialiseListeners();
	}

	execute() {
		const params = getHashParameters();
		if (params.get("tab") !== "controls") return;
		if (params.has("option") && params.get("option") !== "give-to-user") return;

		makeBalancesClickable();
	}

	cleanup() {
		removeClickableBalances();
	}

	storageKeys() {
		return ["settings.pages.faction.clickableBalances"];
	}
}

import { isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { getHashParameters, isHTMLElement } from "@common/utils/functions/dom.ts";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements.ts";
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
		const balanceElement = findElement("[class*='editBalanceWrap___']", row, true);
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
	const activeMember = !findElement("[class*='inactive___']", row, true);

	fillBalance(user.combined, balance, activeMember);
}
function fillBalance(user: string, amount: number, activeMember: boolean) {
	const moneyRoot = moneyRootElement();
	if (!moneyRoot) {
		console.warn(`TT - Failed to fill the balance for ${user} with ${amount} because we didn't find the money root.`);
		return;
	}

	const moneyInput = findElement<HTMLInputElement>(".input-money:not([type='hidden'])", moneyRoot, true);
	if (!moneyInput) {
		console.warn(`TT - Failed to fill the balance for ${user} with ${amount} because we didn't find the money input.`);
		return;
	}

	const userInput = findElement<HTMLInputElement>("[class*='userAutocomplete___']", moneyRoot, true);
	if (!userInput) {
		console.warn(`TT - Failed to fill the balance for ${user} with ${amount} because we didn't find the user input.`);
		return;
	}

	findElement("[class*='userAutocomplete___']", moneyRoot, true)?.classList.toggle("error", !activeMember);

	updateReactInput(moneyInput, amount.toString());
	updateReactInput(userInput, user);
	// Updating the input opens the autocomplete modal, close it immediately.
	userInput.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
}

function moneyRootElement() {
	return findElement("#faction-give-to-user-root [class*='money___']", true);
}

export default class ClickableBalancesFeature extends Feature {
	constructor() {
		super("Clickable Balances", "faction");
	}

	override precondition() {
		return getPageStatus().access && isInternalFaction;
	}

	override isEnabled() {
		return settings.pages.faction.clickableBalances;
	}

	override initialise() {
		initialiseListeners();
	}

	override execute() {
		const params = getHashParameters();
		if (params.get("tab") !== "controls") return;
		if (params.has("option") && params.get("option") !== "give-to-user") return;

		makeBalancesClickable();
	}

	override storageKeys() {
		return ["settings.pages.faction.clickableBalances"];
	}
}

import { settings } from "@common/utils/data/database";
import { elementBuilder } from "@common/utils/functions/dom";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { Feature } from "@features/feature";
import styles from "./poker-profile-links.module.css";

const OPPONENT = '[class*="opponent_"]';
const NAME = 'p[class*="name_"]';

let observer: MutationObserver | undefined;

function updateOpponent(opponent: Element) {
	const name = findElement(NAME, opponent);

	const existingLink = findElement<HTMLAnchorElement>(`.${styles.profileLink}`, name, true);
	const playerId = /^player-([1-9]\d*)$/.exec(opponent.id)?.[1];
	const playerName = name.textContent.trim();

	if (!playerId || !playerName || findElement(`a:not(.${styles.profileLink}), button`, name, true)) {
		existingLink?.remove();
		return;
	}

	const link =
		existingLink ??
		elementBuilder({
			type: "a",
			class: styles.profileLink,
			attributes: {
				target: "_blank",
				rel: "noopener noreferrer",
			},
		});
	link.href = `/profiles.php?XID=${playerId}`;
	link.setAttribute("aria-label", `Open ${playerName}'s profile in a new tab`);

	// Keep Torn's name text in place so React can continue updating it.
	if (!existingLink) name.append(link);
}

function syncProfileLinks() {
	observer?.disconnect();
	observer = undefined;

	findAllElements(OPPONENT).forEach(updateOpponent);

	observer = new MutationObserver((records) => {
		const opponents = new Set<Element>();
		for (const { target, addedNodes } of records) {
			const element = target instanceof Element ? target : target.parentElement;
			const opponent = element?.closest(OPPONENT);
			if (opponent) {
				opponents.add(opponent);
				continue;
			}

			for (const node of addedNodes) {
				if (!(node instanceof Element)) continue;
				if (node.matches(OPPONENT)) opponents.add(node);
				findAllElements(OPPONENT, node).forEach((seat) => opponents.add(seat));
			}
		}
		opponents.forEach((opponent) => {
			if (opponent.isConnected) updateOpponent(opponent);
		});
	});

	const container = findElement("#react-root", true) ?? findElement(".content-wrapper", true) ?? document.body;
	observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ["id"] });
}

export default class PokerProfileLinksFeature extends Feature {
	constructor() {
		super("Poker Profile Links", "casino");
	}

	override isEnabled() {
		return settings.pages.casino.pokerProfileLinks;
	}

	override execute() {
		syncProfileLinks();
	}

	override reload() {
		syncProfileLinks();
	}

	override storageKeys() {
		return ["settings.pages.casino.pokerProfileLinks"];
	}
}

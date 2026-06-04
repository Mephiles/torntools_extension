import { settings } from "@common/utils/data/database";
import { elementBuilder, findAllElements } from "@common/utils/functions/dom";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@extension/context/feature-manager";
import styles from "./hide-casino-games.module.css";

function hideCasinoGames() {
	const msg = document.querySelector(".msg.right-round");
	if (!msg.querySelector(`.${styles.ttMsg}`)) {
		msg.appendChild(
			elementBuilder({
				type: "div",
				children: [
					elementBuilder({
						type: "span",
						class: styles.ttMsg,
						text: "Some games have been removed by TornTools. They can be re-enabled in TornTools' settings.",
					}),
				],
			}),
		);
	}
	findAllElements(`.games-list .${styles.ttHiddenGame}`).forEach((game) => {
		game.parentElement.classList.remove(styles.ttHiddenParent);
		game.remove();
	});

	for (const gameClass of settings.hideCasinoGames) {
		const game = document.querySelector(`.${gameClass}`);

		game.parentElement.classList.add(styles.ttHiddenParent);
		game.classList.add(styles.ttHiddenGame);
		game.insertAdjacentElement(
			"beforebegin",
			elementBuilder({
				type: "div",
				class: styles.ttHiddenGame,
				children: [elementBuilder({ type: "b", text: "• REMOVED •" })],
			}),
		);
	}
}

async function unhideCasinoGames() {
	document.querySelector(`.${styles.ttMsg}`)?.remove();
	document.querySelector(`.${styles.ttHiddenParent}`).classList.remove(styles.ttHiddenParent);
	findAllElements(`.${styles.ttHiddenGame}`).forEach((x) => x.remove());
}

export default class HideCasinoGamesFeature extends Feature {
	constructor() {
		super("Hide Casino Games", "casino");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return !!settings.hideCasinoGames.length;
	}

	execute() {
		hideCasinoGames();
	}

	async cleanup() {
		await unhideCasinoGames();
	}

	storageKeys() {
		return ["settings.hideCasinoGames"];
	}
}

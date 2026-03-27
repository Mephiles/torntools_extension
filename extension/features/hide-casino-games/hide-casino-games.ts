import "./hide-casino-games.css";
import { Feature } from "@/features/feature-manager";
import { getPageStatus } from "@/utils/common/functions/torn";
import { settings } from "@/utils/common/data/database";
import { requireElement } from "@/utils/common/functions/requires";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";

function hideCasinoGames() {
	const msg = document.querySelector(".msg.right-round");
	if (!msg.querySelector(".tt-msg")) {
		msg.appendChild(
			elementBuilder({
				type: "div",
				children: [
					elementBuilder({
						type: "span",
						class: "tt-msg",
						text: "Some games have been removed by TornTools. They can be re-enabled in TornTools' settings.",
					}),
				],
			})
		);
	}
	findAllElements(".games-list .tt-hidden").forEach((game) => {
		game.parentElement.classList.remove("tt-hidden-parent");
		game.classList.remove("tt-hidden");
		game.parentElement.querySelector(".tt-hidden").remove();
	});

	for (const gameClass of settings.hideCasinoGames) {
		const game = document.querySelector(`.${gameClass}`);

		game.parentElement.classList.add("tt-hidden-parent");
		game.classList.add("tt-hidden");
		game.insertAdjacentElement(
			"beforebegin",
			elementBuilder({
				type: "div",
				class: "tt-hidden",
				children: [elementBuilder({ type: "b", text: "• REMOVED •" })],
			})
		);
	}
}

async function unhideCasinoGames() {
	await requireElement(".games-list");

	document.querySelector(".msg .tt-msg").remove();
	document.querySelector(".tt-hidden-parent").classList.remove("tt-hidden-parent");
	document.querySelector(".tt-hidden").remove();
	findAllElements(".games-list .tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
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

import "./creators.css";
import { elementBuilder } from "@common/utils/functions/dom";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { torntools } from "@common/utils/icons/torntools";
import { TEAM } from "@common/utils/team";
import { Feature } from "@features/feature";

async function showCreators() {
	const id = parseInt(
		(await requireElement(".basic-information .profile-container ul.info-table .user-info-value > *:first-child")).textContent.match(/(?<=\[)\d*(?=])/i)[0],
	);

	const creator = TEAM.find(({ torn }) => torn === id);
	if (!creator?.core) return;

	const title = Array.isArray(creator.title) ? creator.title[0] : creator.title;

	document.querySelector(".content-wrapper .content-title").insertAdjacentElement(
		"afterend",
		elementBuilder({
			type: "div",
			class: "tt-creator",
			children: [torntools(), elementBuilder({ type: "span", text: title })],
		}),
	);
}

export default class CreatorsFeature extends Feature {
	constructor() {
		super("Creators", "profile");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return true;
	}

	async execute() {
		await showCreators();
	}
}

import "./creators.css";
import { Feature } from "@/features/feature-manager";
import { getPageStatus } from "@/utils/common/functions/torn";
import { TEAM } from "@/utils/common/team";
import { elementBuilder } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";
import { torntools } from "@/utils/common/icons/torntools";

async function showCreators() {
	const id = parseInt(
		(await requireElement(".basic-information .profile-container ul.info-table .user-info-value > *:first-child")).textContent.match(/(?<=\[)\d*(?=])/i)[0]
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
		})
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

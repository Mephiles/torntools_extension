import "./user-alias.css";
import { Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";
import { convertToNumber } from "@/utils/common/functions/formatting";

async function addAlias() {
	removeAlias();

	const nameLi: Element = await requireElement(".profile-container.basic-info .info-table > :first-child");
	const userID = convertToNumber(nameLi.querySelector(".user-info-value .bold").textContent.split("[")[1]);
	if (!settings.userAlias[userID]) return;

	const profileImg = document.querySelector(".user.name");
	const aliasSpan = elementBuilder({ type: "span", class: "tt-user-alias", text: settings.userAlias[userID].alias });
	profileImg.insertAdjacentElement("afterend", aliasSpan);

	const cloneLi = nameLi.cloneNode(true) as Element;
	cloneLi.classList.add("tt-alias");
	cloneLi.querySelector(".user-information-section .bold").textContent = "Alias";
	cloneLi.querySelector(".user-info-value .bold").textContent = settings.userAlias[userID].alias;
	nameLi.insertAdjacentElement("afterend", cloneLi);
}

function removeAlias() {
	findAllElements(".tt-alias, .tt-user-alias").forEach((x) => x.remove());
}

export default class UserAliasProfileFeature extends Feature {
	constructor() {
		super("User Alias - Profile", "profile");
	}

	isEnabled() {
		return Object.keys(settings.userAlias).length > 0;
	}

	async execute() {
		await addAlias();
	}

	cleanup() {
		removeAlias();
	}

	storageKeys() {
		return ["settings.userAlias"];
	}
}

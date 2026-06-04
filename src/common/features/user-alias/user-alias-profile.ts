import "./user-alias.css";
import { settings } from "@common/utils/data/database";
import { elementBuilder, findAllElements } from "@common/utils/functions/dom";
import { convertToNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { Feature } from "@features/feature";
import { getUserAliasById } from "@features/user-alias/alias";

async function addAlias() {
	removeAlias();

	const nameLi: Element = await requireElement(".profile-container.basic-info .info-table > :first-child");
	const userID = convertToNumber(nameLi.querySelector(".user-info-value .bold").textContent.split("[")[1]);
	const alias = getUserAliasById(userID);
	if (!alias) return;

	const profileImg = document.querySelector(".user.name");
	const aliasSpan = elementBuilder({ type: "span", class: "tt-user-alias", text: alias.alias });
	profileImg.insertAdjacentElement("afterend", aliasSpan);

	const cloneLi = nameLi.cloneNode(true) as Element;
	cloneLi.classList.add("tt-alias");
	cloneLi.querySelector(".user-information-section .bold").textContent = "Alias";
	cloneLi.querySelector(".user-info-value .bold").textContent = alias.alias;
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
		return settings.userAlias.length > 0;
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

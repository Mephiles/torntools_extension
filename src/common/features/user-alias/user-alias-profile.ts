import "./user-alias.css";
import { settings } from "@common/utils/data/database";
import { elementBuilder } from "@common/utils/functions/dom";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { convertToNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { Feature } from "@features/feature";
import { getUserAliasById } from "@features/user-alias/alias";

async function addAlias() {
	removeAlias();

	const nameLi = await requireElement(".profile-container.basic-info .info-table > :first-child");
	const userID = convertToNumber(findElement(".user-info-value .bold", nameLi).textContent.split("[")[1]);
	const alias = getUserAliasById(userID);
	if (!alias) return;

	const profileImg = findElement(".user.name");
	const aliasSpan = elementBuilder({ type: "span", class: "tt-user-alias", text: alias.alias });
	profileImg.insertAdjacentElement("afterend", aliasSpan);

	const cloneLi = nameLi.cloneNode(true) as Element;
	cloneLi.classList.add("tt-alias");
	findElement(".user-information-section .bold", cloneLi).textContent = "Alias";
	findElement(".user-info-value .bold", cloneLi).textContent = alias.alias;
	nameLi.insertAdjacentElement("afterend", cloneLi);
}

function removeAlias() {
	findAllElements(".tt-alias, .tt-user-alias").forEach((x) => x.remove());
}

export default class UserAliasProfileFeature extends Feature {
	constructor() {
		super("User Alias - Profile", "profile");
	}

	override isEnabled() {
		return settings.userAlias.length > 0;
	}

	override async execute() {
		await addAlias();
	}

	override storageKeys() {
		return ["settings.userAlias"];
	}
}

import "./user-alias.css";
import { getFactionSubpage, isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { elementBuilder, findAllElements, isElement } from "@common/utils/functions/dom";
import { convertToNumber } from "@common/utils/functions/formatting";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";
import { getPage } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import { getUserAliasById } from "@features/user-alias/alias";

const SCOPES_LIST = {
	factions: "faction",
	userlist: "userlist",
	hospital: "hospital",
	jail: "jail",
};

const SELECTORS: Record<keyof typeof SCOPES_LIST, { items: string }> = {
	userlist: { items: ".user-info-list-wrap > li[class*='user'] .user.name" },
	factions: { items: ".members-list .table-body > li [class*='linkWrap___'][href*='profiles']" },
	hospital: { items: ".user-info-list-wrap > li .user.name" },
	jail: { items: ".user-info-list-wrap > li .user.name" },
};

function addListeners() {
	document.addEventListener("click", async (event) => {
		if (FEATURE_MANAGER.isEnabled(UserAliasUserlistFeature) && isElement(event.target) && event.target.closest(".pagination-wrap a[href]"))
			await addAlias();
	});
	if (isInternalFaction) {
		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_INFO].push(async () => {
			if (FEATURE_MANAGER.isEnabled(UserAliasUserlistFeature)) await addAlias();
		});
	}
}

async function addAlias() {
	removeAlias();

	const currentSelector = SELECTORS[getPage() as keyof typeof SELECTORS];
	await requireElement(currentSelector.items);
	const list = findAllElements<HTMLAnchorElement>(currentSelector.items);
	list.forEach((li) => {
		const liID = convertToNumber(li.href.split("?XID=")[1]);
		const alias = getUserAliasById(liID);
		if (!alias) return;

		const aliasSpan = elementBuilder({ type: "span", class: "tt-user-alias-list", text: alias.alias });
		li.insertAdjacentElement("afterend", aliasSpan);
	});
}

function removeAlias() {
	findAllElements(".tt-user-alias-list").forEach((x) => x.remove());
}

export default class UserAliasUserlistFeature extends Feature {
	constructor() {
		super("User Alias - Userlist", SCOPES_LIST[getPage()]);
	}

	isEnabled() {
		return settings.userAlias.length > 0;
	}

	initialise() {
		addListeners();
	}

	async execute() {
		if (getPage() === "factions" && isInternalFaction && getFactionSubpage() !== "info") return;

		await addAlias();
	}

	cleanup() {
		removeAlias();
	}

	storageKeys() {
		return ["settings.userAlias"];
	}
}

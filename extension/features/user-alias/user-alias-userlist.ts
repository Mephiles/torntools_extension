import "./user-alias.css";
import { Feature, FEATURE_MANAGER } from "@/features/feature-manager";
import { getPage } from "@/utils/common/functions/torn";
import { settings } from "@/utils/common/data/database";
import { elementBuilder, findAllElements, isElement } from "@/utils/common/functions/dom";
import { isInternalFaction } from "@/pages/factions-page";
import { CUSTOM_LISTENERS, EVENT_CHANNELS } from "@/utils/common/functions/listeners";
import { convertToNumber } from "@/utils/common/functions/formatting";
import { requireElement } from "@/utils/common/functions/requires";

const SCOPES_LIST = {
	factions: "faction",
	userlist: "userlist",
	hospital: "hospital",
	jail: "jail",
};

const SELECTORS: Record<keyof typeof SCOPES_LIST, { items: string }> = {
	userlist: { items: ".user-info-list-wrap > li[class*='user'] .user.name" },
	factions: { items: ".members-list .table-body > li .user.name" },
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
		if (!settings.userAlias[liID]) return;

		const aliasSpan = elementBuilder({ type: "span", class: "tt-user-alias-list", text: settings.userAlias[liID].alias });
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
		return Object.keys(settings.userAlias).length > 0;
	}

	initialise() {
		addListeners();
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

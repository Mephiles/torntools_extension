import { settings } from "@common/utils/data/database";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

let original = document.title;

async function setTitle() {
	const name = await requireElement("[class*='headerWrapper__'][class*='rose__'] .user-name");

	if (!original) original = document.title;
	document.title = `${name.textContent} | Attack`;
}

export default class PageTitleFeature extends Feature {
	constructor() {
		super("Page Title", "global");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.global.pageTitles;
	}

	override async execute() {
		await setTitle();
	}

	override storageKeys() {
		return ["settings.pages.global.pageTitles"];
	}
}

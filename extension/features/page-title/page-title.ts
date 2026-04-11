import { Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { requireElement } from "@/utils/common/functions/requires";
import { getPageStatus } from "@/utils/common/functions/torn";

let original = document.title;

async function setTitle() {
	const name: Element = await requireElement("[class*='headerWrapper__'][class*='rose__'] .user-name");

	if (!original) original = document.title;
	document.title = `${name.textContent} | Attack`;
}

function reset() {
	document.title = original;
}

export default class PageTitleFeature extends Feature {
	constructor() {
		super("Page Title", "global");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.global.pageTitles;
	}

	async execute() {
		await setTitle();
	}

	cleanup() {
		reset();
	}

	storageKeys() {
		return ["settings.pages.global.pageTitles"];
	}
}

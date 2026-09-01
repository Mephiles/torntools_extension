import { settings } from "@common/utils/data/database";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { toClipboard } from "@common/utils/functions/utilities";
import { Feature } from "@features/feature";

async function addID() {
	await requireElement(".basic-info .info-table > *:first-child");

	const title = document.querySelector("h4#skip-to-content");
	title.textContent = `${title.textContent.trim().match(/(.*)'s? Profile/i)[1]} [${getUserID()}]`;
	title.setAttribute("title", "Click to copy.");
	title.addEventListener("click", copyID);
}
function copyID() {
	toClipboard(document.querySelector("h4#skip-to-content").textContent);
}

function getUserID() {
	return parseInt(
		document.querySelector(".basic-information .profile-container ul.info-table .user-info-value > *:first-child").textContent.match(/(?<=\[)\d*(?=])/i)[0],
	);
}

export default class ProfileIDFeature extends Feature {
	constructor() {
		super("Profile ID", "profile");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.profile.idBesideProfileName;
	}

	override async execute() {
		await addID();
	}

	override storageKeys() {
		return ["settings.pages.profile.idBesideProfileName"];
	}
}

import { Feature } from "@/features/feature-manager";
import { getPageStatus } from "@/utils/common/functions/torn";
import { settings } from "@/utils/common/data/database";
import { requireElement } from "@/utils/common/functions/requires";
import { toClipboard } from "@/utils/common/functions/utilities";

async function addID() {
	await requireElement(".basic-info .info-table > *:first-child");

	const title = document.querySelector("h4#skip-to-content");
	title.textContent = `${title.textContent.trim().match(/(.*)'s? Profile/i)[1]} [${getUserID()}]`;
	title.setAttribute("title", "Click to copy.");
	title.addEventListener("click", copyID);
}

function removeID() {
	const title = document.querySelector("h4#skip-to-content");

	const name = title.textContent.replace(/ \[.*]/g, "");
	title.textContent = `${name}'${name.endsWith("s") ? "" : "s"} Profile`;
	title.removeAttribute("title");
	title.removeEventListener("click", copyID);
}

function copyID() {
	toClipboard(document.querySelector("h4#skip-to-content").textContent);
}

function getUserID() {
	return parseInt(
		document.querySelector(".basic-information .profile-container ul.info-table .user-info-value > *:first-child").textContent.match(/(?<=\[)\d*(?=])/i)[0]
	);
}

export default class ProfileIDFeature extends Feature {
	constructor() {
		super("Profile ID", "profile");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.profile.idBesideProfileName;
	}

	async execute() {
		await addID();
	}

	cleanup() {
		removeID();
	}

	storageKeys() {
		return ["settings.pages.profile.idBesideProfileName"];
	}
}

import "./profile-notes.css";
import { Feature } from "@/features/feature-manager";
import { getPageStatus } from "@/utils/common/functions/torn";
import { notes, settings } from "@/utils/common/data/database";
import { requireElement } from "@/utils/common/functions/requires";
import { createContainer, removeContainer } from "@/utils/common/functions/containers";
import { elementBuilder } from "@/utils/common/functions/dom";
import { ttStorage } from "@/utils/common/data/storage";

async function addNotes() {
	await requireElement(".profile-information-wrapper .box-value");

	const userID = getUserID();
	const { content } = createContainer("Profile Notes", {
		previousElement: document.querySelector(".profile-wrapper"),
		class: "mt10",
	});
	const textarea = elementBuilder({ type: "textarea" });
	if (userID in notes.profile) {
		textarea.value = notes.profile[userID].text || "";
		textarea.style.height = notes.profile[userID].height || "17px";
	} else {
		textarea.value = "";
		textarea.style.height = "17px";
	}
	content.appendChild(textarea);
	textarea.addEventListener("input", (event) => {
		saveNotes((event.target as HTMLInputElement).value, (event.target as HTMLInputElement).style.height);
	});

	new MutationObserver(() => saveNotes(textarea.value, textarea.style.height)).observe(textarea, { attributes: true, attributeFilter: ["style"] });

	function saveNotes(text: string, height: string) {
		ttStorage.change({ notes: { profile: { [userID]: { text, height } } } });
	}
}

function removeNotes() {
	removeContainer("Profile Notes");
}

function getUserID() {
	return document.querySelector(".basic-info .user-info-value .bold").textContent.match(/(?<=\[).*(?=])/g)[0];
}

export default class ProfileNotesFeature extends Feature {
	constructor() {
		super("Profile Notes", "profile");
	}

	precondition() {
		return getPageStatus().access;
	}

	isEnabled() {
		return settings.pages.profile.notes;
	}

	async execute() {
		await addNotes();
	}

	cleanup() {
		removeNotes();
	}

	storageKeys() {
		return ["settings.pages.profile.notes"];
	}
}

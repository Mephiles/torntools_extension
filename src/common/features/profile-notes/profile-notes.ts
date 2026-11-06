import "./profile-notes.css";
import { ttStorage } from "@common/utils/context";
import { notes, settings } from "@common/utils/data/database";
import { createContainer } from "@common/utils/functions/containers";
import { elementBuilder } from "@common/utils/functions/dom";
import { findElement } from "@common/utils/functions/find-elements";
import { logger } from "@common/utils/functions/logger.ts";
import { requireElement } from "@common/utils/functions/requires";
import { getPageStatus } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

async function addNotes() {
	await requireElement(".profile-information-wrapper .box-value");

	const userID = getUserID();
	const { content } = createContainer("Profile Notes", {
		previousElement: findElement(".profile-wrapper"),
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
		saveNote(userID, (event.target as HTMLInputElement).value, (event.target as HTMLInputElement).style.height);
	});

	new MutationObserver(() => saveNote(userID, textarea.value, textarea.style.height)).observe(textarea, { attributes: true, attributeFilter: ["style"] });
}

function saveNote(userId: string, text: string, height: string) {
	if (!text.length) {
		if (userId in notes.profile) {
			ttStorage.update("notes", (notes) => delete notes.profile[userId]).catch((cause) => logger.error("Failed to remove the note.", cause));
		}
	} else {
		ttStorage.change({ notes: { profile: { [userId]: { text, height } } } }).catch((cause) => logger.error("Failed to save the note.", cause));
	}
}
function getUserID() {
	return findElement(".basic-info .user-info-value .bold").textContent!.match(/(?<=\[).*(?=])/g)![0];
}

export default class ProfileNotesFeature extends Feature {
	constructor() {
		super("Profile Notes", "profile");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override isEnabled() {
		return settings.pages.profile.notes;
	}

	override async execute() {
		await addNotes();
	}

	override storageKeys() {
		return ["settings.pages.profile.notes"];
	}
}

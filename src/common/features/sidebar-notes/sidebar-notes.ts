import { Feature } from "@features/feature";
import { ttStorage } from "@utils/context";
import "./sidebar-notes.css";

import { notes, settings } from "@utils/data/database";

import { createContainer, removeContainer } from "@utils/functions/containers";
import { checkDevice, elementBuilder, findElementWithText, findParent, isHTMLElement } from "@utils/functions/dom";
import { requireSidebar } from "@utils/functions/requires";
import { isPageWithSidebar } from "@utils/functions/torn";

async function showNotes() {
	await requireSidebar();

	const { content } = createContainer("Notes", {
		id: "sidebarNotes",
		applyRounding: false,
		contentBackground: false,
		compact: true,
		previousElement: findParent(findElementWithText("h2", "Information"), { partialClass: "sidebar-block_" }),
	});

	content.appendChild(
		elementBuilder({
			type: "textarea",
			class: "notes",
			value: notes.sidebar.text,
			style: { height: notes.sidebar.height },
			events: {
				async mouseup(event) {
					if (!isHTMLElement(event.target) || event.target.style.height === notes.sidebar.height) return;

					await ttStorage.change({ notes: { sidebar: { height: event.target.style.height } } });
				},
				async change(event) {
					if (!isHTMLElement(event.target)) return;

					await ttStorage.change({ notes: { sidebar: { text: (event.target as HTMLInputElement).value } } });
				},
			},
		}),
	);
}

function removeNotes() {
	removeContainer("Notes", { id: "sidebarNotes" });
}

export default class SidebarNotesFeature extends Feature {
	constructor() {
		super("Sidebar Notes", "sidebar");
	}

	precondition() {
		return isPageWithSidebar();
	}

	async requirements() {
		if (!(await checkDevice()).hasSidebar) return "Not supported on mobiles or tablets!";

		return true;
	}

	isEnabled() {
		return settings.pages.sidebar.notes;
	}

	async execute() {
		await showNotes();
	}

	cleanup() {
		removeNotes();
	}

	storageKeys() {
		return ["settings.pages.sidebar.notes"];
	}
}

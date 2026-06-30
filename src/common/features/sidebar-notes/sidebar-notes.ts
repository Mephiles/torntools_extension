import "./sidebar-notes.css";
import { ttStorage } from "@common/utils/context";
import { notes, settings } from "@common/utils/data/database";
import { createContainer, removeContainer } from "@common/utils/functions/containers";
import { checkDevice, elementBuilder, findElementWithText, findParent, isHTMLElement } from "@common/utils/functions/dom";
import { requireSidebar } from "@common/utils/functions/requires";
import { isPageWithSidebar } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";

async function showNotes() {
	await requireSidebar();

	const { content } = createContainer("Notes", {
		id: "sidebarNotes",
		applyRounding: false,
		contentBackground: false,
		compact: true,
		previousElement:
			findParent(findElementWithText("h2", "Information"), { partialClass: "sidebar-block_" }) ??
			document.querySelector("#sidebar [class*='accountLinksWrap___']"),
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

import "./sidebar-notes.css";
import { ttStorage } from "@common/utils/context";
import { notes, settings } from "@common/utils/data/database";
import { createContainer } from "@common/utils/functions/containers";
import { checkDevice, elementBuilder, findParent, isHTMLElement } from "@common/utils/functions/dom";
import { findElement, findElementWithText } from "@common/utils/functions/find-elements";
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
			findParent(findElementWithText("h2", "Information", true), { partialClass: "sidebar-block_" }) ??
			findElement("#sidebar [class*='accountLinksWrap___']", true),
	});

	content.appendChild(
		elementBuilder({
			type: "textarea",
			class: "notes",
			value: notes.sidebar.text,
			style: { height: notes.sidebar.height },
			attributes: {
				autocomplete: "off",
				name: "tt-sidebar-note",
			},
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

export default class SidebarNotesFeature extends Feature {
	constructor() {
		super("Sidebar Notes", "sidebar");
	}

	override precondition() {
		return isPageWithSidebar();
	}

	override async requirements() {
		if (!(await checkDevice()).hasSidebar) return "Not supported on mobiles or tablets!";

		return true;
	}

	override isEnabled() {
		return settings.pages.sidebar.notes;
	}

	override async execute() {
		await showNotes();
	}

	override storageKeys() {
		return ["settings.pages.sidebar.notes"];
	}
}

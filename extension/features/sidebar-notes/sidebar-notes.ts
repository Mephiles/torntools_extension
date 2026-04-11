import "./sidebar-notes.css";
import { Feature } from "@/features/feature-manager";
import { notes, settings } from "@/utils/common/data/database";
import { ttStorage } from "@/utils/common/data/storage";
import { createContainer, removeContainer } from "@/utils/common/functions/containers";
import { checkDevice, elementBuilder, findElementWithText, findParent, isHTMLElement } from "@/utils/common/functions/dom";
import { requireSidebar } from "@/utils/common/functions/requires";

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

					console.log("Resized sidebar notes.", event.target.style.height);
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

	async precondition() {
		return (await checkDevice()).hasSidebar;
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

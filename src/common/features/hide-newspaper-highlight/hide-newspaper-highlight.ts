import "./hide-newspaper-highlight.css";
import { settings } from "@common/utils/data/database";
import { ExecutionTiming, Feature } from "@features/feature";

function hideChats() {
	document.documentElement.classList.add("tt-hide-newspaper-highlight");
}

function showChats() {
	document.documentElement.classList.remove("tt-hide-newspaper-highlight");
}

export default class HideNewspaperHighlightFeature extends Feature {
	constructor() {
		super("Hide Newspaper Highlight", "sidebar", ExecutionTiming.IMMEDIATELY);
	}

	isEnabled() {
		return settings.pages.sidebar.hideNewspaperHighlight;
	}

	execute() {
		hideChats();
	}

	cleanup() {
		showChats();
	}

	storageKeys() {
		return ["settings.pages.sidebar.hideNewspaperHighlight"];
	}

	requiresScreenInformation(): boolean {
		return false;
	}
}

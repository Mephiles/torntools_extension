import "./hide-newspaper-highlight.css";
import { settings } from "@common/utils/data/database";
import { ExecutionTiming, Feature } from "@features/feature";

function hideChats() {
	document.documentElement.classList.add("tt-hide-newspaper-highlight");
}

export default class HideNewspaperHighlightFeature extends Feature {
	constructor() {
		super("Hide Newspaper Highlight", "sidebar", ExecutionTiming.IMMEDIATELY);
	}

	override isEnabled() {
		return settings.pages.sidebar.hideNewspaperHighlight;
	}

	override execute() {
		hideChats();
	}

	override storageKeys() {
		return ["settings.pages.sidebar.hideNewspaperHighlight"];
	}

	override requiresScreenInformation(): boolean {
		return false;
	}
}

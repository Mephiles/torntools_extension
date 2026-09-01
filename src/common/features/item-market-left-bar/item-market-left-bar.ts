import "./item-market-left-bar.css";
import { settings } from "@common/utils/data/database";
import { ExecutionTiming, Feature } from "@features/feature";

export default class ItemMarketLeftBarFeature extends Feature {
	constructor() {
		super("Item Market Left Bar", "item market", ExecutionTiming.IMMEDIATELY);
	}

	override isEnabled() {
		return settings.pages.itemmarket.leftBar;
	}

	override execute() {
		document.documentElement.classList.add("tt-item-market-left-bar");
	}

	override storageKeys() {
		return ["settings.pages.itemmarket.leftBar"];
	}

	override requiresScreenInformation(): boolean {
		return false;
	}
}

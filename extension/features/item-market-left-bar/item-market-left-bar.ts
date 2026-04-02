import "./item-market-left-bar.css";
import { ExecutionTiming, Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";

export default class ItemMarketLeftBarFeature extends Feature {
	constructor() {
		super("Item Market Left Bar", "item market", ExecutionTiming.IMMEDIATELY);
	}

	isEnabled() {
		return settings.pages.itemmarket.leftBar;
	}

	execute() {
		document.documentElement.classList.add("tt-item-market-left-bar");
	}

	cleanup() {
		document.documentElement.classList.remove("tt-item-market-left-bar");
	}

	storageKeys() {
		return ["settings.pages.itemmarket.leftBar"];
	}
}

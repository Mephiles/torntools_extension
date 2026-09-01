import { settings } from "@common/utils/data/database";
import { Feature } from "@features/feature";
import styles from "./fast-hunting.module.css";

export default class FastHuntingFeature extends Feature {
	constructor() {
		super("Fast Hunting", "travel");
	}

	override isEnabled() {
		return settings.pages.travel.fastHunting;
	}

	override execute() {
		document.body.classList.add(styles.fastHunting);
	}

	override storageKeys() {
		return ["settings.pages.travel.fastHunting"];
	}
}

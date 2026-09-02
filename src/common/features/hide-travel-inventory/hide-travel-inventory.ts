import { ttStorage } from "@common/utils/context";
import { localdata, settings } from "@common/utils/data/database";
import { elementBuilder } from "@common/utils/functions/dom";
import { findElement } from "@common/utils/functions/find-elements";
import { requireContent } from "@common/utils/functions/requires";
import { createTTTopLinks, isAbroad, isFlying } from "@common/utils/functions/torn";
import { PHBoldEye, PHBoldEyeSlash } from "@common/utils/icons/phosphor-icons";
import { Feature } from "@features/feature";
import styles from "./hide-travel-inventory.module.css";

async function showButton() {
	await requireContent();
	if (findElement(`.${styles.hideInventoryButton}`, true)) return;

	const ttTopLinks = await createTTTopLinks();

	ttTopLinks.appendChild(
		elementBuilder({
			type: "div",
			class: styles.hideInventoryButton,
			children: [localdata.hiddenTravelInventory ? PHBoldEye() : PHBoldEyeSlash(), "Inventory"],
			events: {
				click: toggleInventory,
			},
		}),
	);

	if (localdata.hiddenTravelInventory) {
		findElement("#travel-root", true)?.classList.add(styles.hiddenInventory);
	}
}

async function toggleInventory() {
	const newState = !localdata.hiddenTravelInventory;

	let icon: SVGElement;
	if (newState) {
		icon = PHBoldEye();
	} else {
		icon = PHBoldEyeSlash();
	}

	findElement(`.${styles.hideInventoryButton} svg`, true)?.replaceWith(icon);
	findElement("#travel-root", true)?.classList.toggle(styles.hiddenInventory, newState);

	await ttStorage.change({ localdata: { hiddenTravelInventory: newState } });
}

export default class HideTravelInventoryFeature extends Feature {
	constructor() {
		super("Hide Travel Inventory", "travel");
	}

	override precondition() {
		return isFlying() || isAbroad();
	}

	override isEnabled() {
		return settings.pages.travel.hideInventoryButton;
	}

	override async execute() {
		await showButton();
	}

	override storageKeys() {
		return ["settings.pages.travel.hideInventoryButton"];
	}
}

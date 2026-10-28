import { ttStorage } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { createCheckbox } from "@common/utils/elements/checkbox/checkbox";
import type { CheckboxObject } from "@common/utils/elements/checkbox/checkbox";
import { createContainer, removeContainer } from "@common/utils/functions/containers";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { logger } from "@common/utils/functions/logger";
import { requireElementOptionally } from "@common/utils/functions/requires";
import { Feature } from "@features/feature";
import styles from "./hide-crime-flavour-text.module.css";

const CONTAINER_ID = "tt-crime-flavour-text";
const CONTAINER_TITLE = "Hide Crime Flavour Text";

let controls: CheckboxObject | null = null;

async function addHubControls() {
	const anchor = await requireElementOptionally(".crimes-hub-root");
	if (!anchor) return;

	const { options } = createContainer(CONTAINER_TITLE, {
		id: CONTAINER_ID,
		class: ["mb10", "reset-styles"],
		onlyHeader: true,
		nextElement: anchor,
	});

	controls = createCheckbox();
	controls.setChecked(settings.pages.crimes2.hideFlavourText);
	controls.onChange(async () => {
		applyHidingClass(controls!.isChecked());
		await ttStorage.change({ settings: { pages: { crimes2: { hideFlavourText: controls!.isChecked() } } } });
	});

	options.appendChild(controls.element);
}

function removeHubControls() {
	controls?.dispose();
	controls = null;

	removeContainer(CONTAINER_TITLE, { id: CONTAINER_ID });
}

function applyHidingClass(hide = settings.pages.crimes2.hideFlavourText) {
	document.body.classList.toggle(styles.hideFlavourText, hide);
}

export default class HideCrimeFlavourTextFeature extends Feature {
	constructor() {
		super("Hide Crime Flavour Text", "crimes");
	}

	override isEnabled() {
		return settings.pages.crimes2.flavourTextControls;
	}

	override initialise() {
		addCustomListener(EVENT_CHANNELS.CRIMES2_HOME_LOADED, () => {
			addHubControls().catch((error) => logger.debug("Couldn't add the crime flavour text controls.", error));
		});
		addCustomListener(EVENT_CHANNELS.CRIMES2_CRIME_LOADED, removeHubControls);
	}

	override execute() {
		applyHidingClass();
		void addHubControls();
	}

	override storageKeys() {
		return ["settings.pages.crimes2.flavourTextControls"];
	}
}

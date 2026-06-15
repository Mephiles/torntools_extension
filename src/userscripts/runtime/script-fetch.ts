import { checkAPIPermission } from "@common/utils/functions/api-key";
import { createContainer, removeContainer } from "@common/utils/functions/containers";
import { elementBuilder } from "@common/utils/functions/dom";
import styles from "./script-fetch.module.css";

const PDA_KEY = "###PDA-APIKEY###";
const STORAGE_LOCATION = "tt_scripts_key";

export async function requiresAPIKey() {
	if (isPDA()) return PDA_KEY;

	const storageKey = localStorage.getItem(STORAGE_LOCATION);
	if (storageKey) return storageKey;

	return new Promise<string>((resolve) => {
		const { options } = createContainer("TornTools Userscript - API Key", {
			nextElement: document.querySelector(".main-items-cont-wrap"),
			onlyHeader: true,
			class: "mb10",
		});

		const keyInput = elementBuilder({ type: "input", class: styles.keyField });

		options.appendChild(
			elementBuilder({
				type: "button",
				class: ["preference-button", styles.keyField],
				text: "Save",
				events: {
					async click() {
						const key = keyInput.value;
						const validation = await checkAPIPermission(key);

						if (validation.access) {
							localStorage.setItem(STORAGE_LOCATION, key);
							removeContainer("TornTools Userscript - API Key");
							resolve(key);
						} else {
							window.alert("Not a valid key or not enough permissions (limited access).");
						}
					},
				},
			}),
		);
		options.appendChild(keyInput);
	});
}

function isPDA() {
	return PDA_KEY.at(0) !== "#";
}

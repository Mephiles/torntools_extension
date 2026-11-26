import { ttStorage } from "@common/utils/context.ts";
import { api } from "@common/utils/data/database.ts";
import { checkAPIPermission } from "@common/utils/functions/api-key";
import { createContainer, removeContainer } from "@common/utils/functions/containers";
import { elementBuilder } from "@common/utils/functions/dom";
import { findElement } from "@common/utils/functions/find-elements";
import { TORNTOOLS_PRIVACY_POLICY } from "@common/utils/functions/torn";
import { noop } from "@common/utils/functions/utilities.ts";
import { isPDA } from "@userscripts/utils/script-utils";
import styles from "./script-fetch.module.css";

export const PDA_KEY = "###PDA-APIKEY###";
const STORAGE_LOCATION = "tt_scripts_key";

export async function requiresAPIKey() {
	if (isPDA()) {
		await setKey(PDA_KEY);
		return PDA_KEY;
	}

	if (api.torn.key) return api.torn.key;

	const storageKey = localStorage.getItem(STORAGE_LOCATION);
	if (storageKey) {
		await setKey(storageKey);
		return storageKey;
	}

	return new Promise<string>((resolve) => {
		const { options } = createContainer("TornTools Userscript - API Key", {
			previousElement: findElement(".content-title"),
			onlyHeader: true,
			class: "mb10",
		});

		const keyInput = elementBuilder({ type: "input", class: styles.keyField });

		options.append(
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
							setKey(key).then(() => resolve(key));
						} else {
							window.alert("Not a valid key or not enough permissions (limited access).");
						}
					},
				},
			}),
			keyInput,
			elementBuilder({
				type: "a",
				class: styles.privacyNote,
				href: TORNTOOLS_PRIVACY_POLICY,
				text: "Privacy policy",
				attributes: { target: "_blank", rel: "noopener noreferrer" },
			}),
		);
	});
}

export function optionalAPIKey() {
	requiresAPIKey().then(noop, noop);
}

async function setKey(key: string) {
	await ttStorage.change({ api: { torn: { key } } });
	api.torn.key = key;
}

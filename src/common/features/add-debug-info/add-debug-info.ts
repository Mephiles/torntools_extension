import { Feature } from "@features/feature";
import { RUNTIME_ENVIRONMENT } from "@utils/context";
import "./add-debug-info.css";

import { settings } from "@utils/data/database";
import { elementBuilder, executeScript, getHashParameters } from "@utils/functions/dom";
import { requireElement } from "@utils/functions/requires";

let debugInfo: string | undefined;

async function addDebugInfo() {
	if (!viewingTTForumThread()) return;
	if (document.querySelector("#tt-debug-info-btn")) return;

	const addDebugInfoBtn = elementBuilder({
		type: "button",
		text: "Add TornTools Debug Info",
		id: "tt-debug-info-btn",
		class: "tt-btn",
		events: {
			click: async () => {
				const bbcEditor = document.querySelector("#editor-wrapper .editor-content.mce-content-body");
				if (!bbcEditor) return;
				if (bbcEditor.innerHTML.startsWith("Debug Information:")) return;

				// Get browser info.
				if (!debugInfo) {
					const manifestVersion = RUNTIME_ENVIRONMENT.getVersion();
					const ttVersion = `TornTools version: ${manifestVersion}`;

					if (navigator.userAgentData) {
						// Chrome and others
						const uaData = await navigator.userAgentData.getHighEntropyValues([
							"fullVersionList",
							"model",
							"platform",
							"platformVersion",
							"uaFullVersion",
						]);
						const platformInfo = `${uaData.platform} ${uaData.platformVersion}`;
						const browserInfo = uaData.brands
							.filter((b) => !b.brand.includes("Brand"))
							.map((b) => `${b.brand} v${b.version}`)
							.join(" - ");

						debugInfo = `${platformInfo}<br>${browserInfo}`;
					} else {
						// Firefox
						debugInfo = `User Agent: ${navigator.userAgent}`;
					}

					debugInfo = `Debug Information:<br>${debugInfo}<br>${ttVersion}`;
				}

				// Add debug info to BBCode input.
				bbcEditor.innerHTML = `${debugInfo}<br>${bbcEditor.innerHTML}`;

				// Add the browser information to BBCode input.
				// Need jQuery as dispatchEvent is not working.
				executeScript(RUNTIME_ENVIRONMENT.getURL("/add-debug-info--inject.js"));
			},
		},
	});

	(await requireElement("#editor-form")).insertAdjacentElement("afterend", addDebugInfoBtn);
}

function removeButton() {
	document.querySelector("#tt-debug-info-btn")?.remove();
}

function viewingTTForumThread() {
	// https://www.torn.com/forums.php#/p=threads&f=67&t=16243863

	const hashParams = getHashParameters();
	return hashParams.get("p") === "threads" && parseInt(hashParams.get("f")) === 67 && parseInt(hashParams.get("t")) === 16243863;
}

export default class AddDebugInfoFeature extends Feature {
	constructor() {
		super("Add Debug Info", "forums");
	}

	isEnabled() {
		return settings.pages.forums.debugInfoBtn;
	}

	initialise() {
		void addDebugInfo();
		window.addEventListener("hashchange", addDebugInfo);
	}

	cleanup() {
		removeButton();
		window.removeEventListener("hashchange", addDebugInfo);
	}

	storageKeys() {
		return ["settings.pages.forums.debugInfoBtn"];
	}
}

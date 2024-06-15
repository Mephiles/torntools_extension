"use strict";

(() => {
	const feature = featureManager.registerFeature(
		"Add Debug Info",
		"forums",
		() => settings.pages.forums.debugInfoBtn,
		addListener,
		null,
		removeButton,
		{ storage: ["settings.pages.forums.debugInfoBtn"] },
		null
	);

	function addListener() {
		addDebugInfo();
		window.addEventListener("hashchange", addDebugInfo);
	}

	let debugInfo;
	async function addDebugInfo() {
		if (!feature.enabled()) return;
		if (!viewingTTForumThread()) return;
		if (document.find("#tt-debug-info-btn")) return;

		const addDebugInfoBtn = document.newElement({
			type: "button",
			text: "Add TornTools Debug Info",
			id: "tt-debug-info-btn",
			class: "tt-btn",
			events: {
				click: async () => {
					const bbcEditor = document.find("#editor-wrapper .editor-content.mce-content-body");
					if (!bbcEditor) return;
					if (bbcEditor.innerHTML.startsWith("Debug Information:")) return;

					// Get browser info.
					let browser = "Not defined";
					if (!debugInfo) {
						const ttVersion = "TornTools version: " + version.current;

						if (navigator.userAgentData) {
							// Chrome and others
							debugInfo = await navigator.userAgentData.getHighEntropyValues([
								"fullVersionList",
								"model",
								"platform",
								"platformVersion",
								"uaFullVersion",
							]);
							const platformInfo = debugInfo.platform + " " + debugInfo.platformVersion;
							const browserInfo = debugInfo.fullVersionList[1].brand + " v" + debugInfo.uaFullVersion.split(".")[0];

							debugInfo = platformInfo + "<br>" + browserInfo;
						} else {
							// Firefox
							debugInfo = "User Agent: " + navigator.userAgent;
						}

						debugInfo = "Debug Information:" + "<br>" + debugInfo + "<br>" + ttVersion;
					}

					// Add debug info to BBCode input.
					bbcEditor.innerHTML = debugInfo + "<br>" + bbcEditor.innerHTML;

					// Add the browser information to BBCode input.
					// Need jQuery as dispatchEvent is not working.
					executeScript(chrome.runtime.getURL("scripts/features/add-debug-info/ttAddDebugInfo.inject.js"));
				},
			},
		});

		(await requireElement("#editor-form")).insertAdjacentElement("afterend", addDebugInfoBtn);
	}

	function removeButton() {
		document.find("#tt-debug-info-btn")?.remove();
	}

	function viewingTTForumThread() {
		// https://www.torn.com/forums.php#/p=threads&f=67&t=16243863

		const hashParams = getHashParameters();
		return hashParams.get("p") === "threads" && parseInt(hashParams.get("f")) === 67 && parseInt(hashParams.get("t")) === 16243863;
	}
})();

"use strict";

(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Attack Timeout Warning",
		"attack",
		() => settings.pages.attack.timeoutWarning,
		null,
		addListener,
		stopListener,
		{
			storage: ["settings.pages.attack.timeoutWarning"],
		},
		null
	);

	let observer;

	async function addListener() {
		stopListener();

		const dialogButtons = await requireElement("#defender [class*='dialogButtons__']");
		if (dialogButtons.childElementCount === 0) return;

		await (new Promise(async (resolve) => {
			dialogButtons.children[0].addEventListener("click", () => {
				resolve();
			});
		}));

		const timeoutValue = await requireElement("span[id^='timeout-value']");

		const soundSource = await new Promise((resolve) => {
			const type = settings.notifications.sound;
			switch (type) {
				case "1":
				case "2":
				case "3":
				case "4":
				case "5":
					return resolve(`resources/audio/notification${type}.wav`);
				case "custom":
					return resolve(settings.notifications.soundCustom);
				default:
					return resolve("resources/audio/notification1.wav");
			}
		});

		const audio = new Audio(chrome.runtime.getURL(soundSource));
		audio.volume = settings.notifications.volume / 100;

		observer = new MutationObserver((mutations) => {
			if (document.find("div[class^='dialogButtons_']")) {
				observer.disconnect();
				observer = undefined;
				return;
			}

			const seconds = textToTime(mutations[0].target.textContent, { short: true }) / TO_MILLIS.SECONDS;
			if (seconds <= 0 || seconds >= 30) return;

			if (seconds <= 0) return;
			else if (seconds === 29 && settings.notifications.types.global) {
				chrome.runtime.sendMessage(
					{ action: "notification", title: "Attack Timeout", message: `Your attack is about to timeout in ${seconds} seconds!`, url: location.href },
					(response) => {
						if (response.error) return reject(response);
						else return resolve(response);
					}
				);
			} else if (seconds >= 30) return;

			audio.play().catch(() => {});
		});
		observer.observe(timeoutValue.firstChild, { characterData: true });
	}

	function stopListener() {
		if (observer) {
			observer.disconnect();
			observer = undefined;
		}
	}
})();

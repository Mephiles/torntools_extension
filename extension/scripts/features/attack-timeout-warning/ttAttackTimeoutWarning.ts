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

	let observer: MutationObserver | undefined;
	let hasSentNotification = false;

	async function addListener() {
		stopListener();

		await requireElement("[class*='playerArea__'] [class*='playerWindow__']");

		const dialogButtons = document.querySelector("[class*='playerArea__'] [class*='playerWindow__'] [class*='dialogButtons__']");
		if (dialogButtons) {
			if (dialogButtons.childElementCount === 0) return;

			await new Promise<void>(async (resolve) => {
				dialogButtons.children[0].addEventListener("click", () => resolve(), { once: true });
			});
		}

		const timeoutValue = await requireElement("span[id^='timeout-value'], [class*='labelContainer___']:nth-child(2) [class*='labelTitle___']");

		observer = new MutationObserver((mutations) => {
			if (document.querySelector("div[class^='dialogButtons_']")) {
				observer.disconnect();
				observer = undefined;
				return;
			}

			if (!isTabFocused()) return;

			const seconds = textToTime(mutations[0].target.textContent, { short: true }) / TO_MILLIS.SECONDS;
			if (seconds <= 0 || seconds >= 30) return;

			if (!hasSentNotification && settings.notifications.types.global) {
				chrome.runtime.sendMessage({
					action: "notification",
					title: "Attack Timeout",
					message: `Your attack is about to timeout in ${seconds} seconds!`,
					url: location.href,
				} satisfies BackgroundMessage);
				hasSentNotification = true;
			} else {
				chrome.runtime.sendMessage({
					action: "play-notification-sound",
					sound: settings.notifications.sound,
					volume: settings.notifications.volume,
				} satisfies BackgroundMessage);
			}
		});
		observer.observe(timeoutValue.firstChild, { characterData: true, subtree: true });
	}

	function stopListener() {
		if (observer) {
			observer.disconnect();
			observer = undefined;
		}
	}
})();

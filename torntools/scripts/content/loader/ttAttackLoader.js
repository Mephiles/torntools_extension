requireDatabase().then(() => {
	console.log("TT - Loader");
	if (settings.pages.attack.warn_when_stacking && getSearchParameters().get("ID") === null) displayWarning();
	if (settings.pages.attack.warn_when_attack_timeout)
		requireElement("div[class^='labelsContainer_'] span[class^='labelTitle_'] span[id^='timeout-value']").then(warnAttackTimeout);
	if (settings.scripts.stats_estimate.attack_page) battleStatOnAttackPage();
});

function displayWarning() {
	if (
		userdata.energy.current > userdata.energy.maximum &&
		userdata.chain.current < 10 &&
		new Date(settings.disable_attack_stacked_warning_until) - new Date() <= 0
	) {
		let rawHTML = `<div class='tt-overlay-div'><span class='tt-overlay-text'>Warning! You have stacked energy. Beware!</span><button class="tt-silver-button tt-ok-button">OK</button><button class="tt-silver-button tt-dnd-button">I'm Chaining/Warring</button></div>`;
		doc.find("a[href='#skip-to-content']").insertAdjacentHTML("afterend", rawHTML);
		doc.find("button.tt-silver-button.tt-ok-button").addEventListener("click", (event) => (event.target.parentElement.style.display = "none"));
		doc.find("button.tt-silver-button.tt-dnd-button").addEventListener("click", (event) => {
			event.target.parentElement.style.display = "none";
			ttStorage.change({ settings: { disable_attack_stacked_warning_until: "" } });
		});
	}
}

function warnAttackTimeout() {
	const attackObserver = new MutationObserver(() => {
		if (doc.find("div[class^='dialogButtons_']")) {
			attackObserver.disconnect();
			return;
		}
		const attackTimerParts = doc.find("div[class^='labelsContainer_'] span[class^='labelTitle_'] span[id^='timeout-value']").innerText.split(":");
		const attackTimer = parseInt(attackTimerParts[0]) * 60 + parseInt(attackTimerParts[1]);
		if (attackTimer === 0 || attackTimer > 60 || doc.find("div[class^='dialogButtons_']")) return;
		if (attackTimer !== 0 && attackTimer < 60) {
			const audio = new Audio(
				chrome.runtime.getURL(`/audio/notification${parseInt(settings.notifications_sound) ? settings.notifications_sound : 1}.wav`)
			);
			audio.volume = settings.notifications_volume;
			audio.play();
		}
	});
	attackObserver.observe(doc.find("div[class^='labelsContainer_'] span[class^='labelTitle_'] span[id^='timeout-value']"), {
		characterData: true,
		childList: true,
		subtree: true,
	});
}

function battleStatOnAttackPage() {
	requireElement("div[aria-describedby*='player-name_'] div[class*='textEntries__']").then(async () => {
		let result;
		let userId = getSearchParameters().get("user2ID");
		if (cache && cache.profileStats[userId] && cache.battleStatsEstimate[userId]) {
			result = {
				stats: cache.profileStats[userId].data,
				battleStatsEstimate: cache.battleStatsEstimate[userId].data,
			};
		} else {
			result = await new Promise((resolve) => {
				fetchApi_v2("torn", { section: "user", objectid: userId, selections: "profile,personalstats,crimes" })
					.then((result) => {
						const data = handleTornProfileData(result);
						const timestamp = new Date().getTime();

						ttStorage.change(
							{
								cache: {
									profileStats: {
										[userId]: {
											timestamp,
											ttl: TO_MILLIS.DAYS,
											data: data.stats,
										},
									},
								},
							},
							() => {
								if (!settings.scripts.stats_estimate.max_level) {
									if (settings.scripts.stats_estimate.global && settings.scripts.stats_estimate.profile)
										cacheEstimate(userId, timestamp, data.battleStatsEstimate, result.last_action);
								}
							}
						);

						resolve(data);
					})
					.catch(({ error }) => resolve({ error }));
			});
		}
		if (result.error) result.battleStatsEstimate = "";
		console.log("Opponent Battle Stats", result.battleStatsEstimate);
		doc.findAll("div[aria-describedby*='player-name_']").forEach((boxTitle) => {
			const textEntries = boxTitle.find("div[class*='textEntries__']");
			const statEstEntry = textEntries.firstElementChild.cloneNode(true);
			statEstEntry.firstElementChild.remove();
			statEstEntry.classList.add("tt-stat");
			if (!mobile) {
				if (boxTitle.getAttribute("aria-describedby").includes(`player-name_${userdata.name}`))
					statEstEntry.firstElementChild.innerText = `Battle Stats: ${numberWithCommas(userdata.total, true)}`;
				else
					statEstEntry.firstElementChild.innerText = `Stats Estimate: ${
						result.battleStatsEstimate ? numberWithCommas(result.battleStatsEstimate, true) : "Error"
					}`;
			} else {
				if (result.battleStatsEstimate.includes("under ")) result.battleStatsEstimate = result.battleStatsEstimate.replace("under ", "<");
				if (result.battleStatsEstimate.includes("over ")) result.battleStatsEstimate = result.battleStatsEstimate.replace("over ", ">");
				if (boxTitle.getAttribute("aria-describedby").includes(`player-name_${userdata.name}`))
					statEstEntry.firstElementChild.innerText = `Stats: ${numberWithCommas(userdata.total, true)}`;
				else
					statEstEntry.firstElementChild.innerText = `Stats: ${
						result.battleStatsEstimate ? numberWithCommas(result.battleStatsEstimate, true) : "Error"
					}`;
			}
			textEntries.classList.add("tt-change-margin");
			textEntries.insertAdjacentElement("afterbegin", statEstEntry);
		});
	});
}

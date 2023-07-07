"use strict";

(async () => {
	if (!getPageStatus().access) return;
	if (isOwnProfile()) return;

	const statsEstimate = new StatsEstimate(false);
	featureManager.registerFeature(
		"Stats Estimate",
		"stat estimates",
		() => settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.profiles,
		null,
		showEstimate,
		removeEstimate,
		{
			storage: ["settings.scripts.statsEstimate.global", "settings.scripts.statsEstimate.profiles"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
		},
	);

	let observer;

	async function showEstimate() {
		const userInfoValue = await requireElement(".basic-information .info-table .user-info-value > *:first-child");

		if (settings.scripts.statsEstimate.maxLevel && settings.scripts.statsEstimate.maxLevel < getLevel()) return;

		const id = parseInt(userInfoValue.textContent.trim().match(/\[(\d*)]/i)[1]);

		let estimate, data;
		if (ttCache.hasValue("stats-estimate", id)) {
			estimate = ttCache.get("stats-estimate", id);
		} else if (ttCache.hasValue("profile-stats", id)) {
			data = ttCache.get("profile-stats", id);
		} else {
			if (settings.pages.profile.box && settings.pages.profile.boxStats && settings.apiUsage.user.personalstats && settings.apiUsage.user.crimes) {
				data = await new Promise((resolve) => CUSTOM_LISTENERS[EVENT_CHANNELS.PROFILE_FETCHED].push(({ data }) => resolve(data)));
			} else {
				try {
					data = await fetchData("torn", { section: "user", id, selections: ["profile", "personalstats", "crimes"], silent: true });

					ttCache.set({ [id]: data }, TO_MILLIS.HOURS * 6, "profile-stats").catch(() => {});
				} catch (error) {
					console.log("TT - Couldn't fetch users stats.", error);
				}
			}
		}

		if (!estimate) {
			if (data) {
				const {
					rank,
					level,
					criminalrecord: { total: crimes },
					personalstats: { networth },
					last_action: { timestamp: lastAction },
				} = data;

				estimate = statsEstimate.getAndCacheResult(id, rank, level, crimes, networth, lastAction * 1000);
			} else {
				console.log("TT - Failed to load estimates.");
				return;
			}
		}

		const title = document.find(".profile-right-wrapper > .profile-action .title-black");

		title.appendChild(document.newElement({ type: "span", class: "tt-stats-estimate-profile", text: estimate }));

		observer?.disconnect();
		observer = new MutationObserver((mutations) => {
			if (![...mutations].some((mutation) => [...mutation.addedNodes].every((node) => node.nodeType === Document.TEXT_NODE))) return;

			title.appendChild(document.newElement({ type: "span", class: "tt-stats-estimate-profile", text: estimate }));
		});
		observer.observe(title, { childList: true });

		function getLevel() {
			const levelWrap = document.find(".box-info .box-value");

			return (
				(parseInt(levelWrap.find(".digit-r .digit").textContent) || 0) * 100 +
				(parseInt(levelWrap.find(".digit-m .digit").textContent) || 0) * 10 +
				parseInt(levelWrap.find(".digit-l .digit").textContent)
			);
		}
	}

	function removeEstimate() {
		observer?.disconnect();
		observer = undefined;

		document.find(".tt-stats-estimate-profile")?.remove();
	}
})();

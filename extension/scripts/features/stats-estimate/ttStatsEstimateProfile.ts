(async () => {
	if (!getPageStatus().access) return;
	if (isOwnProfile()) return;

	const statsEstimate = new StatsEstimate("Profile", false);
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

			return true;
		}
	);

	let observer: MutationObserver | undefined;

	async function showEstimate() {
		const userInfoValue = await requireElement(".basic-information .info-table .user-info-value > *:first-child");

		if (settings.scripts.statsEstimate.maxLevel && settings.scripts.statsEstimate.maxLevel < getLevel()) return;

		const id = parseInt(userInfoValue.textContent.trim().match(/\[(\d*)]/i)[1]);

		const estimate = await statsEstimate.fetchEstimate(id);

		const title = document.find(".profile-right-wrapper > .profile-action .title-black");

		title.appendChild(elementBuilder({ type: "span", class: "tt-stats-estimate-profile", text: estimate }));

		observer?.disconnect();
		observer = new MutationObserver((mutations) => {
			if (![...mutations].some((mutation) => [...mutation.addedNodes].every(isTextNode))) return;
			if (title.find(".tt-stats-estimate-profile")) return;

			title.appendChild(elementBuilder({ type: "span", class: "tt-stats-estimate-profile", text: estimate }));
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

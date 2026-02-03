(async () => {
	if (!getPageStatus().access) return;

	const statsEstimate = new StatsEstimate("Targets", true);
	const feature = featureManager.registerFeature(
		"Stats Estimate",
		"stat estimates",
		() => settings.scripts.statsEstimate.global && settings.scripts.statsEstimate.targets,
		registerListeners,
		showEstimates,
		removeEstimates,
		{
			storage: ["settings.scripts.statsEstimate.global", "settings.scripts.statsEstimate.targets"],
		},
		() => {
			if (!hasAPIData()) return "No API access.";

			return true;
		}
	);

	async function registerListeners() {
		const listObserver = new MutationObserver((mutations) => {
			if (mutations.some((mutation) => [...mutation.addedNodes].filter(isElement).some((node) => node.matches("li[class*='tableRow__']")))) {
				if (feature.enabled()) showEstimates();
			}
		});

		const tableObserver = new MutationObserver((mutations) => {
			if (mutations.some((mutation) => [...mutation.addedNodes].filter(isElement).some((node) => node.tagName === "UL"))) {
				if (feature.enabled()) {
					showEstimates();
					listObserver.observe(document.find(".tableWrapper > ul"), { childList: true });
				}
			}
		});

		tableObserver.observe(await requireElement(".tableWrapper"), { childList: true });
		listObserver.observe(await requireElement(".tableWrapper > ul"), { childList: true });
	}

	async function showEstimates() {
		document.body.classList.add("tt-transparent-estimates");
		await requireElement(".tableWrapper ul > li");

		statsEstimate.clearQueue();
		statsEstimate.showEstimates(
			".tableWrapper ul > li",
			(row) => ({
				id: parseInt(row.find<HTMLAnchorElement>("[class*='userInfoBox__'] a[href*='profiles.php']").href.match(/(?<=XID=).*/)[0]),
				level: row.find("[class*='level__']").textContent.getNumber(),
			}),
			true
		);
	}

	function removeEstimates() {
		statsEstimate.clearQueue();
		findAllElements(".tt-stats-estimate").forEach((estimate) => estimate.remove());
	}
})();

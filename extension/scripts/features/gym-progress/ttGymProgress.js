"use strict";

(async () => {
	featureManager.registerFeature(
		"Gym Progress",
		"gym",
		() => settings.pages.gym.progress,
		null,
		addProgress,
		removeDiv,
		{
			storage: ["settings.pages.gym.progress"],
		},
		null
	);

	async function addProgress() {
		const gymNotification = await requireElement("#gymroot [class*='notificationText__']");
		const gymGoals = [
			200, 500, 1000, 2000, 2750, 3000, 3500, 4000, 6000, 7000, 8000, 11000, 12420, 18000, 18100, 24140, 31260, 36610, 46640, 56520, 67775, 84535, 106305,
		];

		const currentGym = document.find("[class*='gymButton_'][class*='inProgress_']");
		if (!currentGym) return;

		const index = currentGym.id.split("-")[1] - 2;
		const percentage = currentGym.find("[class*='percentage_']").textContent.getNumber();
		let goal = gymGoals[index];
		if (userdata.job_perks.some((perk) => perk.indexOf("increased gym experience") > -1)) goal = goal / 1.3;

		const stat = (goal * (percentage / 100)).dropDecimals();
		if (!stat || !goal) return;

		gymNotification.closest("[class*='notification__']").classList.add("tt-modified");
		gymNotification.appendChild(
			document.newElement({
				type: "p",
				class: "tt-gym-energy-progress",
				text: "Estimated Energy progress: ",
				children: [document.newElement({ type: "span", text: `${formatNumber(stat, { decimals: 0 })}/${formatNumber(goal, { decimals: 0 })}E.` })],
			})
		);
	}

	function removeDiv() {
		document.findAll(".tt-gym-energy-progress").forEach((x) => {
			x.closest("[class*='notification__']").classList.remove("tt-modified");
			x.remove();
		});
	}
})();

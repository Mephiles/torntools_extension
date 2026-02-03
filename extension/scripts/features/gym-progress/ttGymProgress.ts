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

		let currentGym: Element;
		try {
			currentGym = await requireElement("[class*='gymButton_'][class*='inProgress_']");
		} catch (error) {
			console.log("TornTools: No gym progress bar found. User probably unlocked all gyms.");
		}
		if (!currentGym) return;

		const categoryElement = currentGym.parentElement;
		const categoryElementIndex = Array.from(categoryElement.parentElement.children).indexOf(categoryElement);

		const currentGymIndex = Array.from(currentGym.parentElement.children).indexOf(currentGym);
		const index = categoryElementIndex * 8 + currentGymIndex - 1;

		const percentage = currentGym.find("[class*='percentage_']").textContent.getNumber();
		let goal = gymGoals[index];
		if (hasAPIData() && userdata.job_perks.some((perk) => perk.includes("gym experience"))) goal = goal / 1.3;

		const stat = dropDecimals(goal * (percentage / 100));
		if (!stat || !goal) return;

		gymNotification.closest("[class*='notification__']").classList.add("tt-modified");
		gymNotification.appendChild(
			elementBuilder({
				type: "p",
				class: "tt-gym-energy-progress",
				text: "Estimated Energy progress: ",
				children: [elementBuilder({ type: "span", text: `${formatNumber(stat)}/${formatNumber(goal)}E.` })],
			})
		);
	}

	function removeDiv() {
		findAllElements(".tt-gym-energy-progress").forEach((x) => {
			x.closest("[class*='notification__']").classList.remove("tt-modified");
			x.remove();
		});
	}
})();

(async () => {
	await requireFeatureManager();

	await requireElement("body");
	const devices = await checkDevice();
	if (devices.mobile || devices.tablet) return "Not supported on mobiles or tablets!";

	featureManager.registerFeature(
		"Achievements",
		"achievements",
		() => settings.scripts.achievements.show,
		null,
		showAchievements,
		removeAchievements,
		{
			storage: ["settings.scripts.achievements.show", "settings.scripts.achievements.completed"],
		},
		() => {
			if (
				!hasAPIData() ||
				!settings.apiUsage.user.personalstats ||
				!settings.apiUsage.user.perks ||
				!settings.apiUsage.user.medals ||
				!settings.apiUsage.user.honors ||
				!settings.apiUsage.user.crimes ||
				!settings.apiUsage.user.battlestats ||
				!settings.apiUsage.user.workstats ||
				!settings.apiUsage.user.skills ||
				!settings.apiUsage.user.weaponexp
			)
				return "No API access.";

			return true;
		}
	);

	async function showAchievements() {
		await requireSidebar();

		const page = getPage();
		let achievements = ACHIEVEMENTS.filter(
			(achievement) =>
				(!achievement.requirements.pages || achievement.requirements.pages.includes(page)) &&
				(!achievement.requirements.condition || achievement.requirements.condition())
		).sort((a, b) => {
			let upperA = a.group ? a.group.toUpperCase() : a.name.toUpperCase();
			let upperB = b.group ? b.group.toUpperCase() : b.name.toUpperCase();

			if (upperA > upperB) return 1;
			else if (upperA < upperB) return -1;
			else {
				upperA = a.name.toUpperCase();
				upperB = b.name.toUpperCase();

				if (upperA > upperB) return 1;
				else if (upperA < upperB) return -1;
				else return 0;
			}
		});
		if (!achievements.length) return;

		fillGoals();

		if (!settings.scripts.achievements.completed) {
			achievements = achievements.filter((achievement) => !achievement.completed);

			if (!achievements.length) {
				removeAchievements();
				return;
			}
		}

		displayContainer();

		function fillGoals() {
			ACHIEVEMENTS.forEach((achievement) => {
				achievement.current = achievement.stats();

				if (achievement.detection) {
					achievement.goals = [];

					let { keyword, include, exclude, goals } = achievement.detection;
					if (!include) include = [];
					if (!exclude) exclude = [];

					if (keyword) {
						for (const type of ["honors", "medals"]) {
							const merits: TornMedal[] | TornHonor[] = torndata[type];

							for (const merit of merits) {
								const description = merit.description.toLowerCase();
								if (!description.includes(keyword)) continue;

								if (include.length && !include.every((incl) => description.includes(incl))) continue;
								if (exclude.length && exclude.some((excl) => description.includes(excl))) continue;

								let desc = description;
								desc = desc.split("for at least")[0]; // remove 'day' numbers from networth
								desc = desc.replace(/\D|\d+%/g, ""); // replace all non-numbers and percentages

								const score = parseInt(desc) || null;
								if (score === null || isNaN(score)) continue;

								// Remove duplicates.
								const duplicate = achievement.goals.find((goal) => goal.score === score);
								if (duplicate) {
									duplicate.count = duplicate.count ? duplicate.count + 1 : 2;
									continue;
								}

								achievement.goals.push({ score, completed: !!userdata[type].find((a: TornHonor | TornMedal) => a.id === merit.id) });
							}
						}
					}
					if (goals)
						achievement.goals.push(...goals.map(({ score, type, id }) => ({ score: score, completed: !!userdata[type].find((a) => a.id === id) })));

					achievement.goals = achievement.goals.sort((a, b) => {
						if (a.score > b.score) return 1;
						else if (a.score < b.score) return -1;
						else return 0;
					});
					achievement.completed = achievement.goals.every((goal) => goal.completed);
				} else {
					achievement.completed = false;
				}
			});
		}

		function displayContainer() {
			const { content, options } = createContainer("Awards", {
				applyRounding: false,
				contentBackground: false,
				compact: true,
				previousElement: findElementWithText<Element>("h2", "Areas").closest("[class*='sidebar-block_']"),
			});
			showTimer();

			const tooltipContent = elementBuilder({ type: "div", class: "tt-achievement-tooltip-content" });
			const tooltip = elementBuilder({
				type: "div",
				class: "tt-achievement-tooltip",
				children: [elementBuilder({ type: "div", class: "tt-achievement-tooltip-arrow" }), tooltipContent],
			});
			document.body.appendChild(tooltip);

			for (const achievement of achievements) {
				const hasGoals = !!achievement.goals;

				const dataset: { [key: string]: any } = { score: achievement.current };
				let text: string;
				if (achievement.completed) text = "Completed!";
				else if (achievement.goals)
					text = `${formatNumber(achievement.current, { shorten: true })}/${formatNumber(achievement.goals.find((goal) => !goal.completed).score, {
						shorten: true,
					})}`;
				else text = formatNumber(achievement.current, { shorten: true });

				if (hasGoals) dataset.goals = achievement.goals.map(({ score, completed }) => ({ score, completed }));

				const pill = elementBuilder({
					type: "div",
					class: `pill tt-award ${achievement.completed ? "completed" : ""}`,
					text: `${achievement.name}: ${text}`,
					attributes: { tabindex: "-1" },
					dataset,
				});

				if (hasGoals) {
					if (!mobile && !tablet) {
						pill.addEventListener("mouseenter", showTooltip);
						pill.addEventListener("mouseleave", hideTooltip);
					}

					pill.addEventListener("focus", showTooltip);
					pill.addEventListener("blur", hideTooltip);
				}

				content.appendChild(pill);
			}

			function showTimer() {
				const timer = elementBuilder({
					type: "span",
					class: "tt-awards-time-ago",
					text: formatTime({ milliseconds: userdata.dateBasic }, { type: "ago", short: true }),
					dataset: {
						seconds: Math.floor(userdata.dateBasic / TO_MILLIS.SECONDS),
						timeSettings: { type: "ago", short: true },
					},
				});
				options.appendChild(timer);
				countTimers.push(timer);
			}

			function showTooltip(event: Event) {
				const target = event.target as HTMLElement;
				if (target.classList.contains("active")) return;

				const active = document.querySelector(".tt-award.active");
				if (active) active.classList.remove("active");

				target.classList.add("active");

				const position = target.getBoundingClientRect();
				const positionBody = document.body.getBoundingClientRect();
				tooltip.style.left = `${position.x + 172 + 7}px`;
				tooltip.style.top = `${position.y + Math.abs(positionBody.y) + 6}px`;
				tooltip.style.display = "block";
				tooltipContent.innerHTML = "";

				const progress = elementBuilder({ type: "ol", class: "awards-progress" });

				const score = parseInt(target.dataset.score);
				const goals = JSON.parse(target.dataset.goals);

				let addedScore = false;
				for (const goal of goals) {
					if (goal.score > score && !addedScore) {
						progress.appendChild(getNode(score, false, true));
						addedScore = true;
					}

					if (goal.score !== score) {
						progress.appendChild(getNode(goal.score, goal.completed, false));
					}
				}
				if (!addedScore) {
					progress.appendChild(getNode(score, false, true));
				}

				tooltipContent.appendChild(progress);

				function getNode(score: number, isCompleted: boolean, isActive: boolean) {
					return elementBuilder({
						type: "li",
						class: `${isCompleted ? "is-completed" : ""} ${isActive ? "is-current" : ""}`,
						children: [elementBuilder({ type: "span", text: formatNumber(score, { shorten: 3, decimals: 1 }) })],
					});
				}
			}

			function hideTooltip(event: Event) {
				if (document.activeElement === event.target) return;
				(event.target as Element).classList.remove("active");

				tooltip.style.display = "none";
			}
		}
	}

	function removeAchievements() {
		removeContainer("Awards");
	}

	return true;
})();

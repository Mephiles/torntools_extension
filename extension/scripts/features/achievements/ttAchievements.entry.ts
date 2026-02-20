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

		let achievements = getRelevantAchievements(getPage());

		if (!settings.scripts.achievements.completed) {
			achievements = achievements.filter((achievement) => !achievement.completed);
		}

		if (!achievements.length) {
			removeAchievements();
			return;
		}

		displayContainer(achievements);

		function getRelevantAchievements(page: string): EnrichedAchievement[] {
			return ACHIEVEMENTS.filter(
				(achievement) =>
					(!achievement.requirements.pages || achievement.requirements.pages.includes(page)) &&
					(!achievement.requirements.condition || achievement.requirements.condition())
			)
				.map<EnrichedAchievement>((achievement) => {
					const goals: EnrichedGoal[] = [];
					let current: number;
					let completed: boolean;

					try {
						current = achievement.stats();
					} catch (error) {
						console.error(`Achievement "${achievement.name}" failed to calculate its score.`, error);
						current = -1;
					}

					if (achievement.detection) {
						let { keyword, include, exclude, goals: detectedGoals } = achievement.detection;
						if (!include) include = [];
						if (!exclude) exclude = [];

						if (keyword) {
							for (const type of ["honors", "medals"] as ("honors" | "medals")[]) {
								const merits = torndata[type];

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
									const duplicate = goals.find((goal) => goal.score === score);
									if (duplicate) {
										duplicate.count++;
										continue;
									}

									goals.push({
										score,
										completed: !!userdata[type].find((a: any) => a.id === merit.id),
										count: 1,
									});
								}
							}
						}

						if (detectedGoals) {
							goals.push(
								...detectedGoals.map(({ score, type, id }) => ({ score, completed: !!userdata[type].find((a) => a.id === id), count: 1 }))
							);
						}

						goals.sort((a, b) => a.score - b.score);
						completed = goals.every((goal) => goal.completed);
					}

					return {
						...achievement,
						goals,
						current,
						completed,
					};
				})
				.sort((a, b) => {
					const groupA = (a.group ?? a.name).toUpperCase();
					const groupB = (b.group ?? b.name).toUpperCase();

					if (groupA !== groupB) return groupA.localeCompare(groupB);
					return a.name.toUpperCase().localeCompare(b.name.toUpperCase());
				});
		}

		function displayContainer(achievements: EnrichedAchievement[]) {
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
				const hasGoals = achievement.goals && achievement.goals.length > 0;

				const dataset: { [key: string]: any } = { score: achievement.current };
				let text: string;
				if (achievement.completed) text = "Completed!";
				else if (hasGoals) {
					const nextGoal = achievement.goals.find((goal) => !goal.completed);
					text = `${formatNumber(achievement.current, { shorten: true })}/${formatNumber(nextGoal?.score || achievement.current, { shorten: true })}`;
				} else {
					text = formatNumber(achievement.current, { shorten: true });
				}

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

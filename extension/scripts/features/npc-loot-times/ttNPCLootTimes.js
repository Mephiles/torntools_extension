"use strict";

(async () => {
	const devices = await checkDevice();
	if (devices.mobile || devices.tablet) return "Not supported on mobiles or tablets!";

	featureManager.registerFeature(
		"NPC Loot Times",
		"sidebar",
		() => settings.pages.sidebar.npcLootTimes,
		null,
		showNPCs,
		removeNPCs,
		{
			storage: ["settings.pages.sidebar.npcLootTimes", "npcs.targets"],
		},
		() => {
			if (!settings.external.yata && !settings.external.tornstats) return "YATA or TornStats not enabled";
		},
	);

	async function showNPCs() {
		await requireSidebar();

		const { content, options } = createContainer("NPCs", {
			id: "npc-loot-times",
			applyRounding: false,
			previousElement: findParent(document.find("h2=Information"), { class: "^=sidebar-block_" }),
		});

		const now = Date.now();

		const timerSettings = { type: "wordTimer", extraShort: true };
		if (npcs.planned) {
			const left = npcs.planned - now;
			const timer = document.newElement({
				type: "span",
				class: "timer",
				text: formatTime(left, timerSettings),
				dataset: {
					seconds: (left / TO_MILLIS.SECONDS).dropDecimals(),
					timeSettings: timerSettings,
				},
			});
			countdownTimers.push(timer);

			content.appendChild(
				document.newElement({
					type: "div",
					class: "tt-npc",
					children: [
						document.newElement({ type: "span", class: "npc-name", text: "Planned Attack" }),
						document.newElement({ type: "div", class: "npc-information", children: [ timer ], }),
					],
				}),
			);
		}

		for (const [id, npc] of Object.entries(npcs.targets).sort(([, a], [, b]) => a.order - b.order)) {
			const status = npc.current === 0 ? "Hospital" : `Level ${npc.current}`;
			const next = npc.current !== 5 ? npc.current + 1 : false;

			let timer;
			if (next) {
				const left = npc.levels[next] - now;

				timer = document.newElement({
					type: "span",
					class: "timer",
					text: formatTime(left, settings),
					dataset: {
						seconds: (left / TO_MILLIS.SECONDS).dropDecimals(),
						timeSettings: timerSettings,
					},
				});

				countdownTimers.push(timer);
			} else timer = document.newElement({ type: "span", class: "timer", text: "max level" });

			content.appendChild(
				document.newElement({
					type: "div",
					class: "tt-npc",
					children: [
						document.newElement({ type: "a", class: "npc-name", href: `https://www.torn.com/profiles.php?XID=${id}`, text: `${npc.name} [${id}]` }),
						document.newElement({
							type: "div",
							class: "npc-information",
							children: [
								document.newElement({ type: "span", class: npc.current === 0 ? "status hospital" : "status", text: status }),
								timer,
							],
						}),
					],
				}),
			);
		}

		// fas-bell-flash

		options.appendChild(
			document.newElement({
				type: "i",
				class: `npc-notifications fas ${settings.notifications.types.npcsGlobal ? "fa-bell" : "fa-bell-slash"}`,
				events: {
					click(event) {
						const notifications = event.target.classList.toggle("fa-bell");

						if (notifications) event.target.classList.remove("fa-bell-slash");
						else event.target.classList.add("fa-bell-slash");

						event.stopPropagation();

						ttStorage.change({ settings: { notifications: { types: { npcsGlobal: notifications } } } });
					},
				},
			})
		);
	}

	function removeNPCs() {
		removeContainer("NPCs", { id: "npc-loot-times" });
	}
})();

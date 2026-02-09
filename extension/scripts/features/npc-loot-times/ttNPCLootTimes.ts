(async () => {
	const { hasSidebar } = await checkDevice();
	if (!hasSidebar) return "Not supported on mobiles or tablets!";

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
			if (!settings.external.yata && !settings.external.tornstats && !settings.external.lzpt) return "YATA, TornStats or LZPT not enabled";
			else if (npcs === null) return "NPC data is not yet available.";

			return true;
		}
	);

	async function showNPCs() {
		await requireSidebar();

		const { content, options } = createContainer("NPCs", {
			id: "npc-loot-times",
			applyRounding: false,
			previousElement: findParent(findElementWithText("h2", "Information"), { partialClass: "sidebar-block_" }),
		});

		const now = Date.now();

		const timerSettings: Partial<FormatTimeOptions> = { type: "wordTimer", extraShort: true };
		if ("planned" in npcs) {
			let timer: HTMLElement;
			if (npcs.planned) {
				const left = npcs.planned - now;
				timer = elementBuilder({
					type: "span",
					class: "timer",
					text: formatTime(left, timerSettings),
					dataset: {
						seconds: dropDecimals(left / TO_MILLIS.SECONDS),
						timeSettings: timerSettings,
					},
				});
				countdownTimers.push(timer);
			} else if (npcs.reason) {
				timer = elementBuilder({ type: "span", class: "timer", text: `After ${npcs.reason}` });
			} else {
				timer = elementBuilder({ type: "span", class: "timer", text: "Not Scheduled" });
			}

			content.appendChild(
				elementBuilder({
					type: "div",
					class: "tt-npc",
					children: [
						elementBuilder({ type: "span", class: "npc-name", text: "Planned Attack" }),
						elementBuilder({ type: "div", class: "npc-information", children: [timer] }),
					],
				})
			);
		}

		let hasNotScheduled = false;
		for (const [id, npc] of Object.entries(npcs.targets).sort(([, a], [, b]) => a.order - b.order)) {
			const status = npc.current === 0 ? "Hospital" : `Level ${npc.current}`;
			const next = npc.current !== 5 ? npc.current + 1 : null;

			let timer: HTMLElement;
			if (next) {
				const left = npc.levels[next] - now;

				timer = elementBuilder({
					type: "span",
					class: "timer",
					text: formatTime(left, timerSettings),
					dataset: {
						seconds: dropDecimals(left / TO_MILLIS.SECONDS),
						timeSettings: timerSettings,
					},
				});

				countdownTimers.push(timer);
			} else timer = elementBuilder({ type: "span", class: "timer", text: "max level" });

			if (!hasNotScheduled && npc.scheduled === false) {
				hasNotScheduled = true;
				content.appendChild(
					elementBuilder({
						type: "div",
						class: "tt-npc-divider",
						text: "-- not scheduled --",
					})
				);
			}

			content.appendChild(
				elementBuilder({
					type: "div",
					class: "tt-npc",
					children: [
						elementBuilder({ type: "a", class: "npc-name", href: `https://www.torn.com/profiles.php?XID=${id}`, text: `${npc.name} [${id}]` }),
						elementBuilder({
							type: "div",
							class: "npc-information",
							children: [elementBuilder({ type: "span", class: npc.current === 0 ? "status hospital" : "status", text: status }), timer],
						}),
					],
				})
			);
		}

		options.appendChild(
			elementBuilder({
				type: "i",
				class: `npc-notifications fa-solid ${settings.notifications.types.npcsGlobal ? "fa-bell" : "fa-bell-slash"}`,
				events: {
					click(event) {
						if (!isElement(event.target)) return;

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

	return true;
})();

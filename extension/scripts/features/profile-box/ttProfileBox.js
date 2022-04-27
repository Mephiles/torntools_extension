"use strict";

(async () => {
	if (!getPageStatus().access) return;
	if (isOwnProfile()) return;

	const STATS = [
		// Attacking
		{ name: "Attacks won", type: "attacking", getter: (data) => data.personalstats.attackswon },
		{ name: "Attacks lost", type: "attacking", getter: (data) => data.personalstats.attackslost },
		{ name: "Attacks stalemated", type: "attacking", getter: (data) => data.personalstats.attacksdraw },
		{ name: "Attacks assisted", type: "attacking", getter: (data) => data.personalstats.attacksassisted },
		{ name: "Arrests made", type: "attacking", getter: (data) => data.personalstats.arrestsmade },
		{ name: "Defends won", type: "attacking", getter: (data) => data.personalstats.defendswon },
		{ name: "Defends lost", type: "attacking", getter: (data) => data.personalstats.defendslost },
		{ name: "Defends stalemated", type: "attacking", getter: (data) => data.personalstats.defendsstalemated },
		// { name: "Defends total", type: "attacking", getter: (data) => 0 },
		// { name: "Win Loss Ratio", type: "attacking", getter: (data) =>  0 },
		{ name: "Elo Rating", type: "attacking", getter: (data) => data.personalstats.elo },
		{ name: "Times escaped", type: "attacking", getter: (data) => data.personalstats.yourunaway },
		{ name: "Foes escaped", type: "attacking", getter: (data) => data.personalstats.theyrunaway },
		{ name: "Unarmored fights won", type: "attacking", getter: (data) => data.personalstats.unarmoredwon },
		{ name: "Best kill streak", type: "attacking", getter: (data) => data.personalstats.bestkillstreak },
		{ name: "Hits", type: "attacking", getter: (data) => data.personalstats.attackhits },
		{ name: "Misses", type: "attacking", getter: (data) => data.personalstats.attackmisses },
		{ name: "Total damage made", type: "attacking", getter: (data) => data.personalstats.attackdamage },
		{ name: "Best damage made", type: "attacking", getter: (data) => data.personalstats.bestdamage },
		{ name: "One hit kills", type: "attacking", getter: (data) => data.personalstats.onehitkills },
		{ name: "Critical hits", type: "attacking", getter: (data) => data.personalstats.attackcriticalhits },
		{ name: "Rounds fired", type: "attacking", getter: (data) => data.personalstats.roundsfired },
		{ name: "Special ammunition used", type: "attacking", getter: (data) => data.personalstats.specialammoused },
		{ name: "Hollow point ammo used", type: "attacking", getter: (data) => data.personalstats.hollowammoused },
		{ name: "Tracer ammo used", type: "attacking", getter: (data) => data.personalstats.tracerammoused },
		{ name: "Piercing ammo used", type: "attacking", getter: (data) => data.personalstats.piercingammoused },
		{ name: "Incendiary ammo used", type: "attacking", getter: (data) => data.personalstats.incendiaryammoused },
		{ name: "Stealth attacks", type: "attacking", getter: (data) => data.personalstats.attacksstealthed },
		{ name: "Retaliations", type: "attacking", getter: (data) => data.personalstats.retals },
		{ name: "Money mugged", type: "attacking", getter: (data) => data.personalstats.moneymugged, formatter: "currency" },
		{ name: "Largest mug", type: "attacking", getter: (data) => data.personalstats.largestmug, formatter: "currency" },
		{ name: "Items looted", type: "attacking", getter: (data) => data.personalstats.itemslooted },
		{ name: "Highest level beaten", type: "attacking", getter: (data) => data.personalstats.highestbeaten },
		{ name: "Total respect", type: "attacking", getter: (data) => data.personalstats.respectforfaction },
		{ name: "Territory wall joins", type: "attacking", getter: (data) => data.personalstats.territoryjoins },
		{ name: "Territory wall time", type: "attacking", getter: (data) => data.personalstats.territorytime },
		// Jobs
		{ name: "Job points used", type: "jobs", getter: (data) => data.personalstats.jobpointsused },
		{ name: "Times trained", type: "jobs", getter: (data) => data.personalstats.trainsreceived },
		// Trading
		{ name: "Market buys", type: "trading", getter: (data) => data.personalstats.itemsbought },
		{ name: "Auctions won", type: "trading", getter: (data) => data.personalstats.auctionswon },
		{ name: "Items auctioned", type: "trading", getter: (data) => data.personalstats.auctionsells },
		{ name: "Item sends", type: "trading", getter: (data) => data.personalstats.itemssent },
		{ name: "Shop purchases", type: "trading", getter: (data) => data.personalstats.cityitemsbought },
		{ name: "Weapons bought", type: "trading", getter: (data) => data.personalstats.weaponsbought },
		{ name: "Points bought", type: "trading", getter: (data) => data.personalstats.pointsbought },
		// Jail
		{ name: "Times jailed", type: "jail", getter: (data) => data.personalstats.jailed },
		{ name: "People busted", type: "jail", getter: (data) => data.personalstats.peoplebusted },
		{ name: "Failed busts", type: "jail", getter: (data) => data.personalstats.failedbusts },
		{ name: "People bailed", type: "jail", getter: (data) => data.personalstats.peoplebought },
		{ name: "Bail fees", type: "jail", getter: (data) => data.personalstats.peopleboughtspent, formatter: "currency" },
		// Hospital
		{ name: "Times in hospital", type: "hospital", getter: (data) => data.personalstats.hospital },
		{ name: "Meds used", type: "hospital", getter: (data) => data.personalstats.medicalitemsused },
		{ name: "Blood withdrawn", type: "hospital", getter: (data) => data.personalstats.bloodwithdrawn },
		{ name: "Revive skill", type: "hospital", getter: (data) => data.personalstats.reviveskill },
		{ name: "Revives given", type: "hospital", getter: (data) => data.personalstats.revives },
		{ name: "Revives received", type: "hospital", getter: (data) => data.personalstats.revivesreceived },
		// Finishing hits
		{ name: "Heavy artillery", type: "finishing hits", getter: (data) => data.personalstats.heahits },
		{ name: "Machine guns", type: "finishing hits", getter: (data) => data.personalstats.machits },
		{ name: "Rifles", type: "finishing hits", getter: (data) => data.personalstats.rifhits },
		{ name: "Sub machine guns", type: "finishing hits", getter: (data) => data.personalstats.smghits },
		{ name: "Shotguns", type: "finishing hits", getter: (data) => data.personalstats.shohits },
		{ name: "Pistols", type: "finishing hits", getter: (data) => data.personalstats.pishits },
		{ name: "Temporary weapons", type: "finishing hits", getter: (data) => data.personalstats.grehits },
		{ name: "Piercing weapons", type: "finishing hits", getter: (data) => data.personalstats.piehits },
		{ name: "Slashing weapons", type: "finishing hits", getter: (data) => data.personalstats.slahits },
		{ name: "Clubbing weapons", type: "finishing hits", getter: (data) => data.personalstats.axehits },
		{ name: "Mechanical weapons", type: "finishing hits", getter: (data) => data.personalstats.chahits },
		{ name: "Hand-to-hand", type: "finishing hits", getter: (data) => data.personalstats.h2hhits },
		// Communication
		{ name: "Mails sent", type: "communication", getter: (data) => data.personalstats.mailssent },
		{ name: "Mails to friends", type: "communication", getter: (data) => data.personalstats.friendmailssent },
		{ name: "Mails to faction", type: "communication", getter: (data) => data.personalstats.factionmailssent },
		{ name: "Mails to colleagues", type: "communication", getter: (data) => data.personalstats.companymailssent },
		{ name: "Mails to spouse", type: "communication", getter: (data) => data.personalstats.spousemailssent },
		{ name: "Classified ads", type: "communication", getter: (data) => data.personalstats.classifiedadsplaced },
		{ name: "Personals placed", type: "communication", getter: (data) => data.personalstats.personalsplaced },
		// Criminal offenses
		{ name: "Criminal offenses", type: "criminal offenses", getter: (data) => data.criminalrecord.total },
		{ name: "Selling illegal goods", type: "criminal offenses", getter: (data) => data.criminalrecord.selling_illegal_products },
		{ name: "Theft", type: "criminal offenses", getter: (data) => data.criminalrecord.theft },
		{ name: "Auto theft", type: "criminal offenses", getter: (data) => data.criminalrecord.auto_theft },
		{ name: "Drug deals", type: "criminal offenses", getter: (data) => data.criminalrecord.drug_deals },
		{ name: "Computer crimes", type: "criminal offenses", getter: (data) => data.criminalrecord.computer_crimes },
		{ name: "Fraud", type: "criminal offenses", getter: (data) => data.criminalrecord.fraud_crimes },
		{ name: "Murder", type: "criminal offenses", getter: (data) => data.criminalrecord.murder },
		{ name: "Other", type: "criminal offenses", getter: (data) => data.criminalrecord.other },
		{ name: "Organized Crimes", type: "criminal offenses", getter: (data) => data.personalstats.organisedcrimes },
		// Bounties
		{ name: "Bounties placed", type: "bounties", getter: (data) => data.personalstats.bountiesplaced },
		{ name: "Spent on bounties", type: "bounties", getter: (data) => data.personalstats.totalbountyspent, formatter: "currency" },
		{ name: "Bounties collected", type: "bounties", getter: (data) => data.personalstats.bountiescollected },
		{ name: "Money rewarded", type: "bounties", getter: (data) => data.personalstats.totalbountyreward, formatter: "currency" },
		{ name: "Bounties received", type: "bounties", getter: (data) => data.personalstats.bountiesreceived },
		{ name: "Received value", type: "bounties", getter: (data) => data.personalstats.receivedbountyvalue, formatter: "currency" },
		// Items
		{ name: "Items found", type: "items", getter: (data) => data.personalstats.cityfinds },
		{ name: "Items trashed", type: "items", getter: (data) => data.personalstats.itemsdumped },
		{ name: "Items found in dump", type: "items", getter: (data) => data.personalstats.dumpfinds },
		{ name: "Items searched in dump", type: "items", getter: (data) => data.personalstats.dumpsearches },
		{ name: "Books read", type: "items", getter: (data) => data.personalstats.booksread },
		{ name: "Boosters used", type: "items", getter: (data) => data.personalstats.boostersused },
		{ name: "Consumables used", type: "items", getter: (data) => data.personalstats.consumablesused },
		{ name: "Candy eaten", type: "items", getter: (data) => data.personalstats.candyused },
		{ name: "Alcohol drunk", type: "items", getter: (data) => data.personalstats.alcoholused },
		{ name: "Energy drinks drunk", type: "items", getter: (data) => data.personalstats.energydrinkused },
		{ name: "Stat enhancers used", type: "items", getter: (data) => data.personalstats.statenhancersused },
		{ name: "Viruses coded", type: "items", getter: (data) => data.personalstats.virusescoded },
		// Travel
		{ name: "Times traveled", type: "travel", getter: (data) => data.personalstats.traveltimes },
		{ name: "Time spent traveling", type: "travel", getter: (data) => data.personalstats.traveltime },
		{ name: "Items bought abroad", type: "travel", getter: (data) => data.personalstats.itemsboughtabroad },
		// { name: "Hunting skill", type: "travel", getter: (data) => 0 },
		{ name: "Attacks won abroad", type: "travel", getter: (data) => data.personalstats.attackswonabroad },
		{ name: "Defends lost abroad", type: "travel", getter: (data) => data.personalstats.defendslostabroad },
		{ name: "Argentina", type: "travel", getter: (data) => data.personalstats.argtravel },
		{ name: "Mexico", type: "travel", getter: (data) => data.personalstats.mextravel },
		{ name: "United Arab Emirates", type: "travel", getter: (data) => data.personalstats.dubtravel },
		{ name: "Hawaii", type: "travel", getter: (data) => data.personalstats.hawtravel },
		{ name: "Japan", type: "travel", getter: (data) => data.personalstats.japtravel },
		{ name: "United Kingdom", type: "travel", getter: (data) => data.personalstats.lontravel },
		{ name: "South Africa", type: "travel", getter: (data) => data.personalstats.soutravel },
		{ name: "Switzerland", type: "travel", getter: (data) => data.personalstats.switravel },
		{ name: "China", type: "travel", getter: (data) => data.personalstats.chitravel },
		{ name: "Canada", type: "travel", getter: (data) => data.personalstats.cantravel },
		{ name: "Cayman Islands", type: "travel", getter: (data) => data.personalstats.caytravel },
		// Drugs
		{ name: "Drugs used", type: "drugs", getter: (data) => data.personalstats.drugsused },
		{ name: "Times overdosed", type: "drugs", getter: (data) => data.personalstats.overdosed },
		{ name: "Rehabilitations", type: "drugs", getter: (data) => data.personalstats.rehabs },
		{ name: "Rehabilitation fees", type: "drugs", getter: (data) => data.personalstats.rehabcost, formatter: "currency" },
		{ name: "Cannabis taken", type: "drugs", getter: (data) => data.personalstats.cantaken },
		{ name: "Ecstasy taken", type: "drugs", getter: (data) => data.personalstats.exttaken },
		{ name: "Ketamine taken", type: "drugs", getter: (data) => data.personalstats.kettaken },
		{ name: "LSD taken", type: "drugs", getter: (data) => data.personalstats.lsdtaken },
		{ name: "Opium taken", type: "drugs", getter: (data) => data.personalstats.opitaken },
		{ name: "PCP taken", type: "drugs", getter: (data) => data.personalstats.pcptaken },
		{ name: "Shrooms taken", type: "drugs", getter: (data) => data.personalstats.shrtaken },
		{ name: "Speed taken", type: "drugs", getter: (data) => data.personalstats.spetaken },
		{ name: "Vicodin taken", type: "drugs", getter: (data) => data.personalstats.victaken },
		{ name: "Xanax taken", type: "drugs", getter: (data) => data.personalstats.xantaken },
		// Missions
		{ name: "Missions completed", type: "missions", getter: (data) => data.personalstats.missionscompleted },
		{ name: "Duke contracts completed", type: "missions", getter: (data) => data.personalstats.dukecontractscompleted },
		{ name: "Contracts completed", type: "missions", getter: (data) => data.personalstats.contractscompleted },
		{ name: "Mission credits earned", type: "missions", getter: (data) => data.personalstats.missioncreditsearned },
		// Racing
		{ name: "Racing points earned", type: "racing", getter: (data) => data.personalstats.racingpointsearned },
		{ name: "Races entered", type: "racing", getter: (data) => data.personalstats.racesentered },
		{ name: "Races won", type: "racing", getter: (data) => data.personalstats.raceswon },
		{ name: "Racing skill", type: "racing", getter: (data) => data.personalstats.racingskill },
		// Networth
		{ name: "Networth", type: "networth", getter: (data) => data.personalstats.networth, formatter: "currency" },
		// Other
		{ name: "Time played", type: "other", getter: (data) => data.personalstats.useractivity },
		{ name: "Current activity streak", type: "other", getter: (data) => data.personalstats.activestreak },
		{ name: "Best activity streak", type: "other", getter: (data) => data.personalstats.bestactivestreak },
		{ name: "Awards", type: "other", getter: (data) => data.personalstats.awards },
		{ name: "Energy refills", type: "other", getter: (data) => data.personalstats.refills },
		{ name: "Nerve refills", type: "other", getter: (data) => data.personalstats.nerverefills },
		{ name: "Token refills", type: "other", getter: (data) => data.personalstats.tokenrefills },
		{ name: "Merits bought", type: "other", getter: (data) => data.personalstats.meritsbought },
		{ name: "Days been a donator", type: "other", getter: (data) => data.personalstats.daysbeendonator },
	];

	featureManager.registerFeature(
		"Profile Box",
		"profile",
		() =>
			settings.pages.profile.box &&
			(settings.pages.profile.boxStats || settings.pages.profile.boxSpy || settings.pages.profile.boxStakeout || settings.pages.profile.boxAttackHistory),
		null,
		showBox,
		removeBox,
		{
			storage: [
				"settings.pages.profile.box",
				"settings.pages.profile.boxStats",
				"settings.pages.profile.boxSpy",
				"settings.pages.profile.boxStakeout",
				"settings.pages.profile.boxAttackHistory",
				"settings.pages.global.keepAttackHistory",
			],
		},
		() => {
			if (!hasAPIData()) return "No API access.";
		}
	);

	let overlayStatus = false;

	async function showBox() {
		const userInfoValue = await requireElement(".basic-information .info-table .user-info-value > *:first-child");

		const id = parseInt(userInfoValue.textContent.trim().match(/\[([0-9]*)]/i)[1]);

		const { content, options } = createContainer("User Information", {
			nextElement: document.find(".medals-wrapper") || document.find(".basic-information")?.closest(".profile-wrapper"),
			class: "mt10",
		});

		if (settings.pages.profile.boxFetch) {
			showRelative();
			buildStats().catch((error) => console.log("TT - Couldn't build the stats part of the profile box.", error));
			buildSpy().catch((error) => console.log("TT - Couldn't build the spy part of the profile box.", error));
		} else {
			const button = document.newElement({
				type: "button",
				class: "tt-btn",
				text: "Fetch data from the API.",
				events: {
					async click() {
						showLoadingPlaceholder(section, true);
						button.classList.add("tt-hidden");

						let finished = 0;

						showRelative();
						buildStats()
							.catch((error) => console.log("TT - Couldn't build the stats part of the profile box.", error))
							.then(handleBuild);
						buildSpy()
							.catch((error) => console.log("TT - Couldn't build the spy part of the profile box.", error))
							.then(handleBuild);

						function handleBuild() {
							finished++;

							if (finished === 1) {
								section.remove();
							} else if (finished === 2) {
								for (const section of [...content.findAll(".section[order]")].sort(
									(a, b) => parseInt(a.getAttribute("order")) - parseInt(b.getAttribute("order"))
								))
									section.parentElement.appendChild(section);
							}
						}
					},
				},
			});

			const section = document.newElement({
				type: "div",
				class: "manually-fetch",
				children: [button],
			});

			content.appendChild(section);
		}

		buildStakeouts().catch((error) => console.log("TT - Couldn't build the stakeout part of the profile box.", error));
		buildAttackHistory().catch((error) => console.log("TT - Couldn't build the attack history part of the profile box.", error));

		function showRelative() {
			const relativeValue = createCheckbox({ description: "Relative values" });
			relativeValue.setChecked(filters.profile.relative);
			relativeValue.onChange(() => {
				const isRelative = relativeValue.isChecked();

				for (const field of content.findAll(".relative-field")) {
					const value = isRelative ? field.dataset.relative : field.dataset.value;

					// noinspection JSCheckFunctionSignatures
					const options = { ...(JSON.parse(field.dataset.options ?? false) || { decimals: 0 }), forceOperation: isRelative };

					field.textContent = formatNumber(value, options);
				}

				ttStorage.change({ filters: { profile: { relative: isRelative } } });
			});
			options.appendChild(relativeValue.element);
		}

		async function buildStats() {
			if (!settings.pages.profile.boxStats || !settings.apiUsage.user.personalstats || !settings.apiUsage.user.crimes) return;

			const section = document.newElement({ type: "div", class: "section user-stats", attributes: { order: 1 } });
			content.appendChild(section);

			showLoadingPlaceholder(section, true);

			let data;
			if (ttCache.hasValue("profile-stats", id)) {
				data = ttCache.get("profile-stats", id);
			} else {
				try {
					data = await fetchData("torn", { section: "user", id, selections: ["profile", "personalstats", "crimes"], silent: true });

					triggerCustomListener(EVENT_CHANNELS.PROFILE_FETCHED, { data });

					ttCache.set({ [id]: data }, TO_MILLIS.HOURS * 6, "profile-stats").catch(() => {});
				} catch (error) {
					console.log("TT - Couldn't fetch users stats.", error);
				}
			}

			if (data) {
				buildCustom();
				buildOthers();

				// noinspection JSUnusedGlobalSymbols
				const sortable = new Sortable(section.find(".custom-stats .tt-table-body"), {
					animation: 150,
					disabled: true,
					onEnd: () => saveStats(),
				});

				const moveButton = document.newElement({
					type: "button",
					class: "move-stats",
					children: [document.newElement({ type: "i", class: "fas fa-arrows-alt" })],
					events: {
						click() {
							if (moveButton.classList.toggle("active")) {
								// Enable movement.
								section.find(".other-stats-button").setAttribute("disabled", "");
								section.findAll(".custom-stats .tt-table-row").forEach((row) => row.classList.add("tt-sortable"));

								sortable.option("disabled", false);
							} else {
								// Disable movement.
								section.find(".other-stats-button").removeAttribute("disabled");
								section.findAll(".custom-stats .tt-table-row").forEach((row) => row.classList.remove("tt-sortable"));

								sortable.option("disabled", true);
							}
						},
					},
				});

				const otherList = document.newElement({
					type: "button",
					class: "tt-btn other-stats-button",
					text: "View other stats.",
					events: {
						click() {
							const isCustom = !content.find(".custom-stats").classList.toggle("tt-hidden");

							if (isCustom) {
								content.find(".other-stats").classList.add("tt-hidden");
								content.find(".move-stats").classList.remove("tt-hidden");
								otherList.textContent = "View other stats.";
							} else {
								content.find(".other-stats").classList.remove("tt-hidden");
								content.find(".move-stats").classList.add("tt-hidden");
								otherList.textContent = "View custom list.";
							}
						},
					},
				});

				const editButton = document.newElement({
					type: "button",
					class: "edit-stats",
					children: [document.newElement({ type: "i", class: "fas fa-cog" })],
					events: {
						click() {
							const overlay = document.find(".tt-overlay");

							const button = section.find(".edit-stats");
							const otherStatsButton = section.find(".other-stats-button");

							const customStats = section.find(".custom-stats");
							const otherStats = section.find(".other-stats");

							if (overlay.classList.toggle("tt-hidden")) {
								// Overlay is now hidden.
								[button, otherStatsButton, customStats, otherStats].forEach((element) => element.classList.remove("tt-overlay-item"));
								section.findAll(".tt-table-row:not(.tt-table-row-header)").forEach((row) => row.removeEventListener("click", onStatClick));
								overlayStatus = false;
							} else {
								// Overlay is now shown.
								[button, otherStatsButton, customStats, otherStats].forEach((element) => element.classList.add("tt-overlay-item"));
								section.findAll(".tt-table-row:not(.tt-table-row-header)").forEach((row) => row.addEventListener("click", onStatClick));
								overlayStatus = true;
							}
						},
					},
				});

				const actions = document.newElement({ type: "div", class: "stat-actions", children: [moveButton, otherList, editButton] });
				section.appendChild(actions);
			} else {
				section.appendChild(document.newElement({ type: "div", class: "stats-error-message", text: "Failed to fetch data." }));
			}

			showLoadingPlaceholder(section, false);

			async function onStatClick(event) {
				const row = event.target.closest(".tt-table-row");
				if (!row) return;

				const table = row.closest(".tt-table");
				const isCustom = table.classList.contains("custom-stats");
				if (isCustom) {
					row.remove();
					await saveStats();
					buildOthers(true);
				} else {
					const otherTable = table.previousElementSibling.find(".tt-table-body");

					otherTable.appendChild(row);
					await saveStats();
				}
			}

			function saveStats() {
				const stats = [...section.findAll(".custom-stats .tt-table-row")].map((row) => row.children[0].textContent);

				return ttStorage.change({ filters: { profile: { stats } } });
			}

			function createStatsTable(id, rows, hidden = false, hasHeaders = false) {
				return createTable(
					[
						{ id: "stat", title: "Stat", width: 140, cellRenderer: "string" },
						{ id: "them", title: "Them", class: "their-stat", width: 80, cellRenderer: "number" },
						{ id: "you", title: "You", class: "your-stat", width: 80, cellRenderer: "number" },
					],
					rows,
					{
						class: `${id} ${hidden ? "tt-hidden" : ""}`,
						cellRenderers: {
							number: (data) => {
								let node;
								if (typeof data === "object") {
									const isRelative = filters.profile.relative;

									const value = isRelative ? data.relative : data.value;
									const forceOperation = isRelative;

									const options = { decimals: 0, forceOperation };
									node = document.newElement({
										type: "span",
										class: "relative-field",
										text: formatNumber(value, options),
										dataset: { value: data.value, relative: data.relative, options },
									});
								} else {
									node = document.createTextNode(formatNumber(data, { decimals: 0 }));
								}

								return {
									element: node,
									dispose: () => {},
								};
							},
							currency: (data) => {
								let node;
								if (typeof data === "object") {
									const isRelative = filters.profile.relative;

									const value = isRelative ? data.relative : data.value;
									const forceOperation = isRelative;

									const options = { decimals: 0, currency: true, forceOperation };
									node = document.newElement({
										type: "span",
										class: "relative-field",
										text: formatNumber(value, options),
										dataset: { value: data.value, relative: data.relative, options },
									});
								} else {
									node = document.createTextNode(formatNumber(data, { decimals: 0, currency: true }));
								}

								return {
									element: node,
									dispose: () => {},
								};
							},
						},
						rowClass: (rowData, isHeader) => {
							if (isHeader) return "";
							if (rowData.them === "N/A" || rowData.you?.value === "N/A" || rowData.them === rowData.you?.value) return "";

							return rowData.them > rowData.you?.value ? "superior-them" : "superior-you";
						},
						stretchColumns: true,
						hasHeaders,
					}
				);
			}

			function buildCustom() {
				const stats = filters.profile.stats;

				const rows = stats
					.map((name) => {
						const stat = STATS.find((_stat) => _stat.name === name);
						if (!stat) return false;

						const them = stat.getter(data);
						const you = stat.getter(userdata);
						if (isNaN(them) || isNaN(you)) return false;

						const row = {
							stat: stat.name,
							them: them,
							you: { value: you, relative: you - them },
						};

						if (stat.formatter) row.cellRenderer = stat.formatter;

						return row;
					})
					.filter((value) => !!value);

				const table = createStatsTable("custom-stats", rows, false, false);
				section.appendChild(table.element);
			}

			function buildOthers(requireCleanup) {
				const stats = filters.profile.stats;

				const _stats = STATS.filter((stat) => !stats.includes(stat.name))
					.map((stat) => {
						const them = stat.getter(data);
						const you = stat.getter(userdata);
						if (isNaN(them) || isNaN(you)) return false;

						const row = {
							stat: stat.name,
							them: them,
							you: { value: you, relative: you - them },
							type: stat.type,
						};

						if (stat.formatter) row.cellRenderer = stat.formatter;

						return row;
					})
					.filter((value) => !!value);
				const types = [...new Set(_stats.map((stat) => stat.type))];

				const rows = types.flatMap((type) => {
					return [{ header: capitalizeText(type) }, ..._stats.filter((stat) => stat.type === type)];
				});

				const table = createStatsTable("other-stats", rows, true, true);

				if (requireCleanup) {
					section.find(".other-stats")?.remove();

					if (overlayStatus) {
						table.element.classList.add("tt-overlay-item");
						table.element.findAll(".tt-table-row:not(.tt-table-row-header)").forEach((row) => row.removeEventListener("click", onStatClick));
					}

					const actions = section.find(".stat-actions");
					actions.parentElement.insertBefore(table.element, actions);
				} else {
					section.appendChild(table.element);
				}
			}
		}

		async function buildSpy() {
			if (!settings.pages.profile.boxSpy || !settings.apiUsage.user.battlestats) return;

			const section = document.newElement({ type: "div", class: "section spy-information", attributes: { order: 2 } });
			content.appendChild(section);

			showLoadingPlaceholder(section, true);

			const errors = [];
			let spy = false;
			if (settings.external.yata) {
				try {
					let result;
					if (ttCache.hasValue("yata-spy", id)) {
						result = ttCache.get("yata-spy", id);
					} else {
						result = (await fetchData(FETCH_PLATFORMS.yata, { relay: true, section: "spy", id, includeKey: true, silent: true }))?.spies[id];

						if (result) {
							result = {
								...result,
								update: result.update * 1000,
							};
						}

						ttCache.set({ [id]: result || false }, TO_MILLIS.SECONDS * 30, "yata-spy").then(() => {});
					}

					if (result) {
						spy = {
							defense: result.defense,
							dexterity: result.dexterity,
							speed: result.speed,
							strength: result.strength,
							total: result.total,

							type: false,
							timestamp: result.update,
							updated: formatTime(result.update, { type: "ago" }),
							source: "YATA",
						};
					}
				} catch (error) {
					if (typeof error.error === "object") {
						const { code, error: message } = error.error;

						if (code === 2 && message === "Player not found") errors.push({ service: "YATA", message: "You don't have an account." });
						else if (code === 502) errors.push({ service: "YATA", message: "YATA appears to be down." });
						else errors.push({ service: "YATA", message: `Unknown (${code}) - ${message}` });
					} else if (error.code === 502) {
						errors.push({ service: "YATA", message: "YATA appears to be down." });
					} else if (error.code === CUSTOM_API_ERROR.NO_NETWORK || error.code === CUSTOM_API_ERROR.CANCELLED) {
						errors.push({ service: "YATA", message: "Network issues. You likely have no internet at this moment." });
					} else if (error.code === CUSTOM_API_ERROR.NO_PERMISSION) {
						errors.push({ service: "YATA", message: "Permission not granted. Please make sure YATA has permission to run." });
					} else errors.push({ service: "YATA", message: `Unknown - ${JSON.stringify(error)}` });

					console.log("Couldn't load stat spy from YATA.", error);
				}
			}
			if (settings.external.tornstats) {
				try {
					let result;
					if (ttCache.hasValue("tornstats-spy", id)) {
						result = ttCache.get("tornstats-spy", id);
					} else {
						result = await fetchData(FETCH_PLATFORMS.tornstats, { section: "spy/user", id, silent: true });

						result = {
							status: result.status,
							message: result.message,
							spy: result.spy,
						};

						ttCache.set({ [id]: result }, TO_MILLIS.SECONDS * 30, "tornstats-spy").then(() => {});
					}

					if (result.spy?.status) {
						const timestamp = result.spy.timestamp * 1000;

						if (!spy || timestamp > spy.timestamp) {
							spy = {
								defense: result.spy.defense,
								dexterity: result.spy.dexterity,
								speed: result.spy.speed,
								strength: result.spy.strength,
								total: result.spy.total,

								type: result.spy.type,
								timestamp,
								updated: result.spy.difference,
								source: "TornStats",
							};
						}
					} else {
						if (!result.status) {
							if (result.message) {
								if (result.message.includes("User not found.")) errors.push({ service: "TornStats", message: "You don't have an account." });
								else if (result.spy.message.includes("Spy not found.")) errors.push({ service: "TornStats", message: "No spy found." });
								else errors.push({ service: "TornStats", message: `Unknown - ${result.message}` });
							} else {
								errors.push({ service: "TornStats", message: `Unknown - ${JSON.stringify(result)}` });
							}
						}
					}
				} catch (error) {
					if (typeof error.error === "object") {
						const { code, error: message } = error.error;

						if (code === 429) errors.push({ service: "TornStats", message: "You've exceeded your API limit. Try again in a minute." });
						else errors.push({ service: "TornStats", message: `Unknown (${code}) - ${message}` });
					} else if (error.code === 502) {
						errors.push({ service: "TornStats", message: "TornStats appears to be down." });
					} else if (error.code === CUSTOM_API_ERROR.NO_NETWORK || error.code === CUSTOM_API_ERROR.CANCELLED) {
						errors.push({ service: "TornStats", message: "Network issues. You likely have no internet at this moment." });
					} else if (error.code === CUSTOM_API_ERROR.NO_PERMISSION) {
						errors.push({ service: "TornStats", message: "Permission not granted. Please make sure TornStats has permission to run." });
					} else errors.push({ service: "TornStats", message: `Unknown - ${JSON.stringify(error)}` });

					console.log("Couldn't load stat spy from TornStats.", error);
				}
			}

			showLoadingPlaceholder(section, false);

			if (spy) {
				const table = createTable(
					[
						{ id: "stat", title: "Stat", width: 60, cellRenderer: "string" },
						{ id: "them", title: "Them", class: "their-stat", width: 80, cellRenderer: "number" },
						{ id: "you", title: "You", class: "your-stat", width: 80, cellRenderer: "number" },
					],
					[
						{ stat: "Strength", them: spy.strength, you: { value: userdata.strength, relative: getRelative(spy.strength, userdata.strength) } },
						{ stat: "Defense", them: spy.defense, you: { value: userdata.defense, relative: getRelative(spy.defense, userdata.defense) } },
						{ stat: "Speed", them: spy.speed, you: { value: userdata.speed, relative: getRelative(spy.speed, userdata.speed) } },
						{
							stat: "Dexterity",
							them: spy.dexterity,
							you: { value: userdata.dexterity, relative: getRelative(spy.dexterity, userdata.dexterity) },
						},
						{ stat: "Total", them: spy.total, you: { value: userdata.total, relative: getRelative(spy.total, userdata.total) } },
					],
					{
						cellRenderers: {
							number: (data) => {
								let node;
								if (typeof data === "object") {
									const isRelative = filters.profile.relative;

									const value = isRelative ? data.relative : data.value;
									const forceOperation = isRelative;

									const options = { decimals: 0, forceOperation };
									node = document.newElement({
										type: "span",
										class: "relative-field",
										text: formatNumber(value, options),
										dataset: { value: data.value, relative: data.relative, options },
									});
								} else {
									node = document.createTextNode(formatNumber(data, { decimals: 0 }));
								}

								return {
									element: node,
									dispose: () => {},
								};
							},
						},
						rowClass: (rowData) => {
							if (rowData.them === "N/A" || rowData.you.value === "N/A") return "";

							return rowData.them > rowData.you.value ? "superior-them" : "superior-you";
						},
						stretchColumns: true,
					}
				);
				section.appendChild(table.element);

				let footer;
				if (spy.source && spy.type) footer = `Source: ${spy.source} (${spy.type}), ${spy.updated}`;
				else if (spy.source) footer = `Source: ${spy.source}, ${spy.updated}`;

				if (footer) section.appendChild(document.newElement({ type: "p", class: "spy-source", html: footer }));
			} else {
				section.appendChild(document.newElement({ type: "span", class: "no-spy", text: "There is no spy report." }));

				if (errors.length) {
					section.appendChild(
						document.newElement({
							type: "p",
							class: "no-spy-errors",
							html: errors.map(({ service, message }) => `${service} - ${message}`).join("<br>"),
						})
					);
				}
			}

			function getRelative(them, your) {
				return them === "N/A" || your === "N/A" ? "N/A" : your - them;
			}
		}

		async function buildStakeouts() {
			if (!settings.pages.profile.boxStakeout) return;

			const hasStakeout = id in stakeouts && typeof stakeouts[id] !== "undefined";

			const checkbox = createCheckbox({ description: "Stakeout this user." });
			checkbox.setChecked(hasStakeout);
			checkbox.onChange(() => {
				if (checkbox.isChecked()) {
					ttStorage.change({
						stakeouts: {
							[id]: { alerts: { okay: false, hospital: false, landing: false, online: false, life: false } },
						},
					});

					alerts.classList.remove("tt-hidden");
				} else {
					ttStorage.change({ stakeouts: { [id]: undefined } });

					alerts.classList.add("tt-hidden");
				}
			});

			const isOkay = createCheckbox({ description: "is okay" });
			isOkay.onChange(() => {
				if (!(id in stakeouts)) return;

				ttStorage.change({ stakeouts: { [id]: { alerts: { okay: isOkay.isChecked() } } } });
			});

			const isInHospital = createCheckbox({ description: "is in hospital" });
			isInHospital.onChange(() => {
				if (!(id in stakeouts)) return;

				ttStorage.change({ stakeouts: { [id]: { alerts: { hospital: isInHospital.isChecked() } } } });
			});

			const lands = createCheckbox({ description: "lands" });
			lands.onChange(() => {
				if (!(id in stakeouts)) return;

				ttStorage.change({ stakeouts: { [id]: { alerts: { landing: lands.isChecked() } } } });
			});

			const comesOnline = createCheckbox({ description: "comes online" });
			comesOnline.onChange(() => {
				if (!(id in stakeouts)) return;

				ttStorage.change({ stakeouts: { [id]: { alerts: { online: comesOnline.isChecked() } } } });
			});

			const lifeDrops = createTextbox({ description: { before: "life drops below", after: "%" }, type: "number", attributes: { min: 1, max: 100 } });
			lifeDrops.onChange(() => {
				if (!(id in stakeouts)) return;

				ttStorage.change({ stakeouts: { [id]: { alerts: { life: parseInt(lifeDrops.getValue()) || false } } } });
			});

			const offlineFor = createTextbox({ description: { before: "offline for over", after: "hours" }, type: "number", attributes: { min: 1 } });
			offlineFor.onChange(() => {
				if (!(id in stakeouts)) return;

				ttStorage.change({ stakeouts: { [id]: { alerts: { offline: parseInt(offlineFor.getValue()) || false } } } });
			});

			const alerts = document.newElement({
				type: "div",
				class: "alerts",
				children: [isOkay.element, isInHospital.element, lands.element, comesOnline.element, lifeDrops.element, offlineFor.element],
			});

			if (hasStakeout) {
				isOkay.setChecked(stakeouts[id].alerts.okay);
				isInHospital.setChecked(stakeouts[id].alerts.hospital);
				lands.setChecked(stakeouts[id].alerts.landing);
				comesOnline.setChecked(stakeouts[id].alerts.online);
				lifeDrops.setValue(stakeouts[id].alerts.life === false ? "" : stakeouts[id].alerts.life);
				offlineFor.setValue(stakeouts[id].alerts.offline === false ? "" : stakeouts[id].alerts.offline);
			} else {
				alerts.classList.add("tt-hidden");
			}

			content.appendChild(
				document.newElement({ type: "div", class: "section stakeout", attributes: { order: 3 }, children: [checkbox.element, alerts] })
			);
		}

		async function buildAttackHistory() {
			if (!settings.pages.profile.boxAttackHistory || !settings.pages.global.keepAttackHistory) return;

			const section = document.newElement({ type: "div", class: "section attack-history", attributes: { order: 4 } });

			if (id in attackHistory.history) {
				const history = attackHistory.history[id];

				const table = createTable(
					[
						{ id: "win", title: "Wins", class: "positive", width: 40, cellRenderer: "string" },
						{ id: "defend", title: "Defends", class: "positive last-cell", width: 60, cellRenderer: "string" },
						{ id: "lose", title: "Lost", class: "negative", width: 30, cellRenderer: "string" },
						{ id: "defend_lost", title: "Defends lost", class: "negative", width: 80, cellRenderer: "string" },
						{ id: "stalemate", title: "Stalemates", class: "negative", width: 70, cellRenderer: "string" },
						{ id: "escapes", title: "Escapes", class: "negative last-cell", width: 60, cellRenderer: "string" },
						{ id: "respect_base", title: "Respect", class: "neutral", width: 50, cellRenderer: "respect" },
					],
					[history],
					{
						cellRenderers: {
							respect: (respectArray) => {
								let respect = respectArray.length ? respectArray.totalSum() / respectArray.length : 0;
								if (respect > 0) respect = formatNumber(respect, { decimals: 2 });
								else respect = "/";

								return {
									element: document.createTextNode(respect),
									dispose: () => {},
								};
							},
						},
						stretchColumns: true,
					}
				);

				section.appendChild(table.element);
			} else {
				section.appendChild(document.newElement({ type: "span", class: "no-history", text: "There is no attack history." }));
			}

			content.appendChild(section);
		}
	}

	function removeBox() {
		removeContainer("User Information");
	}
})();

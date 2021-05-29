// noinspection DuplicatedCode

"use strict";

(async () => {
	featureManager.registerFeature(
		"Jail Filter",
		"jail",
		() => settings.pages.jail.filter,
		initialiseFilters,
		addFilters,
		removeFilters,
		{
			storage: ["settings.pages.jail.filter"],
		},
		null
	);

	function initialiseFilters() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.JAIL_SWITCH_PAGE].push(filtering);
	}

	async function addFilters() {
		await requireElement(".users-list > *:first-child .info-wrap");

		const { content } = createContainer("Jail Filter", {
			nextElement: document.find(".users-list-title"),
		});
		content.innerHTML = `
			<div class="filter-header">
				<div class="statistic" id="showing">Showing <span class="filter-count">X</span> of <span class="filter-total">${
					document.findAll(".users-list > li").length
				}</span> users</div>
			</div>
			<div class="filter-content">
				<div class="filter-wrap" id="activity-filter">
					<div class="filter-heading">Activity</div>
					<div class="filter-multi-wrap">
						<div class="tt-checkbox-wrap">
							<input type="checkbox" value="online" id="tt-jail-filter-online">
							<label for="tt-jail-filter-online">Online</label>
						</div>
						<div class="tt-checkbox-wrap">
							<input type="checkbox" value="idle" id="tt-jail-filter-idle">
							<label for="tt-jail-filter-idle">Idle</label>
						</div>
						<div class="tt-checkbox-wrap">
							<input type="checkbox" value="offline" id="tt-jail-filter-offline">
							<label for="tt-jail-filter-offline">Offline</label>
						</div>
					</div>
				</div>
				<div class="filter-wrap">
					<div class="filter-heading">Faction</div>
					<select name="faction" id="tt-faction-filter">
						<option selected value="">none</option>
						<option disabled value="------">------</option>
					</select>
				</div>
			</div>
		`;
		if (hasAPIData() && Object.keys(userdata) && userdata.faction && userdata.faction.faction_tag)
			content.find(".filter-content #tt-faction-filter").appendChild(
				document.newElement({
					type: "option",
					text: userdata.faction.faction_tag,
					attributes: {
						value: userdata.faction.faction_tag,
					},
				})
			);
		const timeSlider = new DualRangeSlider({ min: 0, max: 100, step: 1, valueLow: filters.jail.timeStart, valueHigh: filters.jail.timeEnd });
		const timeFilter = document.newElement({
			type: "div",
			class: "filter-wrap",
			id: "time-filter",
			children: [
				timeSlider.slider,
				document.newElement({
					type: "div",
					class: "time-filter-info-wrap",
					children: [document.newElement({ type: "span", class: "time-filter-info" })],
				}),
			],
		});
		const levelSlider = new DualRangeSlider({ min: 1, max: 100, step: 1, valueLow: filters.jail.levelStart, valueHigh: filters.jail.levelEnd });
		const levelFilter = document.newElement({
			type: "div",
			class: "filter-wrap",
			id: "level-filter",
			children: [
				levelSlider.slider,
				document.newElement({
					type: "div",
					class: "level-filter-info-wrap",
					children: [document.newElement({ type: "span", class: "level-filter-info" })],
				}),
			],
		});
		const scoreMax = Math.max(
			getJailScore(100, document.find(".users-list > *:first-child .info-wrap .time").lastChild.textContent.trim().split(" ")[0].replace(/[hs]/g, "")),
			5000
		);
		const scoreSlider = new DualRangeSlider({ min: 0, max: scoreMax, step: 25, valueLow: filters.jail.scoreStart, valueHigh: filters.jail.scoreEnd });
		const scoreFilter = document.newElement({
			type: "div",
			class: "filter-wrap",
			id: "score-filter",
			children: [
				scoreSlider.slider,
				document.newElement({
					type: "div",
					class: "score-filter-info-wrap",
					children: [document.newElement({ type: "span", class: "score-filter-info" })],
				}),
			],
		});
		content.find(".filter-content").appendChild(timeFilter);
		content.find(".filter-content").appendChild(levelFilter);
		content.find(".filter-content").appendChild(scoreFilter);

		// Set up the filters
		for (const activity of filters.jail.activity) {
			content.find(`#activity-filter [value="${activity}"]`).checked = true;
		}

		// Listeners
		content.findAll("input[type='checkbox']").forEach((x) => x.addEventListener("click", filtering));
		content.find("#tt-faction-filter").addEventListener("input", filtering);
		[timeSlider.slider, scoreSlider.slider, levelSlider.slider].forEach((slider) =>
			new MutationObserver(filtering).observe(slider, { attributes: true, attributeFilter: ["data-low", "data-high", "value"] })
		);

		addFactionsToList();
		filtering();
	}

	function filtering() {
		requireElement(".users-list > li").then(async () => {
			const content = findContainer("Jail Filter").find(".filter-content");
			const timeFilter = content.find("#time-filter .tt-dual-range");
			const levelFilter = content.find("#level-filter .tt-dual-range");
			const scoreFilter = content.find("#score-filter .tt-dual-range");
			const scoreMax = Math.max(
				getJailScore(
					100,
					document.find(".users-list > *:first-child .info-wrap .time").lastChild.textContent.trim().split(" ")[0].replace(/[hs]/g, "")
				),
				5000
			);
			// Get the set filters
			let activity = [];
			for (const checkbox of content.findAll("#activity-filter input:checked")) {
				activity.push(checkbox.getAttribute("value"));
			}
			const faction = content.find("#tt-faction-filter").value;
			const timeStart = parseInt(timeFilter.dataset.low);
			const timeEnd = parseInt(timeFilter.dataset.high);
			const levelStart = parseInt(levelFilter.dataset.low);
			const levelEnd = parseInt(levelFilter.dataset.high);
			const scoreStart = parseInt(scoreFilter.dataset.low);
			const scoreEnd = parseInt(scoreFilter.dataset.high);
			// Update level and time slider counters
			content.find(".level-filter-info").innerText = `Level ${levelStart} - ${levelEnd}`;
			content.find(".time-filter-info").innerText = `Time ${timeStart}h - ${timeEnd}h`;
			content.find(".score-filter-info").innerText = `Score ${scoreStart} - ${scoreEnd}`;
			// Save filters
			await ttStorage.change({
				filters: {
					jail: {
						timeStart: timeStart,
						timeEnd: timeEnd,
						levelStart: levelStart,
						levelEnd: levelEnd,
						scoreStart: scoreStart,
						scoreEnd: scoreEnd,
						faction: faction,
						activity: activity,
					},
				},
			});
			// Actual Filtering
			for (const li of document.findAll(".users-list > li")) {
				// Activity
				if (
					activity.length &&
					!activity.some(
						(x) =>
							x.trim() ===
							li
								.find("#iconTray li")
								.getAttribute("title")
								.replace(/^<b>/g, "")
								.replace(/<\/b>$/g, "")
								.toLowerCase()
								.trim()
					)
				) {
					showRow(li, false);
					continue;
				}

				// Faction
				const rowFaction = li.find(".user.faction");
				if (
					faction &&
					((rowFaction.childElementCount === 0 && rowFaction.innerText.trim() !== faction.trim()) ||
						(rowFaction.childElementCount !== 0 &&
							rowFaction.find("img") &&
							rowFaction.find("img").getAttribute("title").trim() !== faction.trim()))
				) {
					showRow(li, false);
					continue;
				}
				// Time
				const timeLeftHrs = parseInt(li.find(".info-wrap .time").lastChild.textContent.trim().split(" ")[0].replace(/[hs]/g, ""));
				if ((timeStart && timeLeftHrs < timeStart) || (timeEnd !== 100 && timeLeftHrs > timeEnd)) {
					showRow(li, false);
					continue;
				}
				// Level
				const level = parseInt(li.find(".info-wrap .level").innerText.replace(/\D+/g, ""));
				if ((levelStart && level < levelStart) || (levelEnd !== 100 && level > levelEnd)) {
					showRow(li, false);
					continue;
				}
				// Score
				const score = getJailScore(level, timeLeftHrs);
				if ((scoreStart && score < scoreStart) || (scoreEnd !== scoreMax && score > scoreEnd)) {
					showRow(li, false);
					continue;
				}
				showRow(li);
			}

			function showRow(li, show = true) {
				if (!li.classList) return;
				if (show) li.classList.remove("hidden");
				else li.classList.add("hidden");
			}
			updateStat();
		});
	}

	function addFactionsToList() {
		const content = findContainer("Jail Filter").find(".filter-content");
		const rows = [...document.findAll(".users-list > li .user.faction")];
		const factions = new Set(
			rows[0].find("img")
				? rows
						.map((row) => row.find("img"))
						.filter((img) => !!img)
						.map((img) => img.getAttribute("title").trim())
						.filter((tag) => !!tag)
				: rows.map((row) => row.innerText.trim()).filter((tag) => !!tag)
		);

		for (const fac of factions) {
			content.find("#tt-faction-filter").appendChild(document.newElement({ type: "option", value: fac, text: fac }));
		}
	}

	function updateStat() {
		findContainer("Jail Filter").find(".filter-count").innerText = document.findAll(".users-list > li:not(.hidden)").length;
	}

	function removeFilters() {
		removeContainer("Jail Filter");
		document.findAll(".users-list > li.hidden").forEach((x) => x.classList.remove("hidden"));
	}

	function getJailScore(level, timeLeft) {
		return parseInt(level) * (parseInt(timeLeft) + 3);
	}
})();

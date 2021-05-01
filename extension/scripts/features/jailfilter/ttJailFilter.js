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
		async () => {
			await requireElement(".users-list > *:first-child .info-wrap");
		}
	);

	function initialiseFilters() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.JAIL_SWITCH_PAGE].push(filtering);
	}

	function addFilters() {
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
						<option value="${userdata.faction.faction_tag}">${userdata.faction.faction_tag}</option>
					</select>
				</div>
			</div>
		`;
		const timeFilter = document.newElement({
			type: "div",
			class: "filter-wrap",
			id: "time-filter",
			children: [
				newSlider(),
				document.newElement({
					type: "div",
					class: "time-filter-info-wrap",
					children: [document.newElement({ type: "span", class: "time-filter-info" })],
				}),
			],
		});
		const levelFilter = document.newElement({
			type: "div",
			class: "filter-wrap",
			id: "level-filter",
			children: [
				newSlider(),
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
		const scoreFilter = document.newElement({
			type: "div",
			class: "filter-wrap",
			id: "score-filter",
			children: [
				newSlider(scoreMax, 0),
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
		// There is no faction filter setup
		timeFilter.find(".handle.left").dataset.value = filters.jail.timeStart;
		timeFilter.find(".handle.right").dataset.value = filters.jail.timeEnd;
		timeFilter.find(".tt-dual-range").style.setProperty("--x-1", (filters.jail.timeStart * 150) / 100 - 10.5 + "px");
		timeFilter.find(".tt-dual-range").style.setProperty("--x-2", (filters.jail.timeEnd * 150) / 100 - 10.5 + "px");
		levelFilter.find(".handle.left").dataset.value = filters.jail.levelStart;
		levelFilter.find(".handle.right").dataset.value = filters.jail.levelEnd;
		levelFilter.find(".tt-dual-range").style.setProperty("--x-1", (filters.jail.levelStart * 150) / 100 - 10.5 + "px");
		levelFilter.find(".tt-dual-range").style.setProperty("--x-2", (filters.jail.levelEnd * 150) / 100 - 10.5 + "px");
		scoreFilter.find(".handle.left").dataset.value = filters.jail.scoreStart;
		scoreFilter.find(".handle.right").dataset.value = filters.jail.scoreEnd;
		scoreFilter
			.find(".tt-dual-range")
			.style.setProperty("--x-1", filters.jail.scoreStart < scoreMax ? (filters.jail.scoreStart / scoreMax) * 150 - 10.5 + "px" : "-10.5px");
		scoreFilter
			.find(".tt-dual-range")
			.style.setProperty("--x-2", filters.jail.scoreEnd < scoreMax ? (filters.jail.scoreEnd / scoreMax) * 150 - 10.5 + "px" : "137px");

		// Listeners
		content.findAll("input[type='checkbox']").forEach((x) => x.addEventListener("click", filtering));
		content.find("#tt-faction-filter").addEventListener("input", filtering);
		content.findAll(".handle.left, .handle.right").forEach((x) => new MutationObserver(filtering).observe(x, { attributes: true }));

		addFactionsToList();
		filtering();
	}

	function filtering() {
		requireElement(".users-list > li").then(async () => {
			const content = findContainer("Jail Filter").find(".filter-content");
			const timeFilter = content.find("#time-filter");
			const levelFilter = content.find("#level-filter");
			const scoreFilter = content.find("#score-filter");
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
			const timeStart = parseInt(timeFilter.find(".handle.left").dataset.value);
			const timeEnd = parseInt(timeFilter.find(".handle.right").dataset.value);
			const levelStart = parseInt(levelFilter.find(".handle.left").dataset.value);
			const levelEnd = parseInt(levelFilter.find(".handle.right").dataset.value);
			const scoreStart = parseInt(scoreFilter.find(".handle.left").dataset.value);
			const scoreEnd = parseInt(scoreFilter.find(".handle.right").dataset.value);
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

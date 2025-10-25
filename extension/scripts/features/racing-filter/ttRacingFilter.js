"use strict";

(async () => {
	if (!getPageStatus().access) return;

	console.log("[TT] Racing Filter script loaded");

	const feature = featureManager.registerFeature(
		"Racing Filter",
		"racing",
		() => settings.pages.racing.filter,
		initialise,
		addFilters,
		removeFilters,
		{
			storage: ["settings.pages.racing.filter"],
		},
		null
	);

	function initialise() {
		addXHRListener(async ({ detail: { page, xhr, uri } }) => {
			if (!feature.enabled()) return;

			if ((page === "page" || page === "loader") && uri) {
				const sid = uri.sid;
				if (sid !== "racing" && sid !== "undefined") {
					removeFilters();
					return;
				}

				const tab = uri.tab;
				if (tab !== "customrace" && tab !== "undefined") {
					removeFilters();
					return;
				}

				await requireElement(".events-list");

				addFilters();
			}
		});
	}

	const localFilters = {};

	async function addFilters() {
		await requireElement(".custom-events-wrap");

		const { content } = createContainer("Racing Filter", {
			class: "mt10",
			nextElement: document.find(".custom-events-wrap"),
			filter: true,
			compact: true,
		});

		const filterContent = document.newElement({
			type: "div",
			class: "content",
		});

		// Statistics
		const statistics = createStatistics("races");
		content.appendChild(statistics.element);
		localFilters["Statistics"] = { updateStatistics: statistics.updateStatistics };

		// Hide races
		const hideRacesFilter = createFilterSection({
			type: "HideRaces",
			defaults: filters.racing.hideRaces,
			callback: applyFilters,
		});
		filterContent.appendChild(hideRacesFilter.element);
		localFilters["HideRaces"] = { getSelections: hideRacesFilter.getSelections };

		// Start time
		const timeFilter = createFilterSection({
			title: "Start Time Filter",
			noTitle: true,
			slider: {
				min: 0,
				max: 48,
				step: 1,
				valueLow: filters.racing.timeStart,
				valueHigh: filters.racing.timeEnd,
			},
			callback: applyFilters,
		});
		filterContent.appendChild(timeFilter.element);
		localFilters["Start Time Filter"] = { getStartEnd: timeFilter.getStartEnd, updateCounter: timeFilter.updateCounter };

		// Laps
		const lapsFilter = createFilterSection({
			title: "Laps",
			noTitle: true,
			slider: {
				min: 1,
				max: 100,
				step: 1,
				valueLow: filters.racing.lapsMin,
				valueHigh: filters.racing.lapsMax,
			},
			callback: applyFilters,
		});
		filterContent.appendChild(lapsFilter.element);
		localFilters["Laps"] = { getStartEnd: lapsFilter.getStartEnd, updateCounter: lapsFilter.updateCounter };

		// Drivers
		const driversFilter = createFilterSection({
			title: "Drivers",
			noTitle: true,
			slider: {
				min: 2,
				max: 100,
				step: 1,
				valueLow: filters.racing.lapsMin,
				valueHigh: filters.racing.lapsMax,
			},
			callback: applyFilters,
		});
		filterContent.appendChild(driversFilter.element);
		localFilters["Drivers"] = { getStartEnd: driversFilter.getStartEnd, updateCounter: driversFilter.updateCounter };

		// Track
		const trackFilter = createFilterSection({
			title: "Track",
			multiSelect: 6,
			select: [
				...[
					"Uptown",
					"Withdrawal",
					"Underdog",
					"Parkland",
					"Docks",
					"Commerce",
					"Two Islands",
					"Industrial",
					"Vector",
					"Mudpit",
					"Hammerhead",
					"Sewege",
					"Meltdown",
					"Speedway",
					"Stone Park",
					"Convict",
				].map((track) => ({ value: track, description: track })),
			],
			defaults: filters.racing.track,
			callback: applyFilters,
		});
		filterContent.appendChild(trackFilter.element);
		localFilters["Track"] = { getSelected: trackFilter.getSelected };

		// Race name
		const nameFilter = createFilterSection({
			title: "Name",
			text: true,
			default: filters.racing.name,
			callback: applyFilters,
		});
		filterContent.appendChild(nameFilter.element);
		localFilters["Name"] = { getValue: nameFilter.getValue };

		content.appendChild(filterContent);

		await applyFilters();
	}

	async function applyFilters() {
		await requireElement(".events-list > li");
		const content = findContainer("Racing Filter").find("main");
		const hideRacesFilter = localFilters["HideRaces"].getSelections(content);
		const startTimeFilter = localFilters["Start Time Filter"].getStartEnd(content);
		const timeStart = parseInt(startTimeFilter.start);
		const timeEnd = parseInt(startTimeFilter.end);
		const lapsFilter = localFilters["Laps"].getStartEnd(content);
		const minLaps = parseInt(lapsFilter.start);
		const maxLaps = parseInt(lapsFilter.end);
		const driversFilter = localFilters["Drivers"].getStartEnd(content);
		const driversMin = parseInt(driversFilter.start);
		const driversMax = parseInt(driversFilter.end);
		const trackFilter = localFilters["Track"].getSelected(content);
		const nameFilter = localFilters["Name"].getValue();

		// Update level and time slider counters
		localFilters["Start Time Filter"].updateCounter(`Race Start In ${timeStart}h - ${timeEnd}h`, content);
		localFilters["Laps"].updateCounter(`Laps ${minLaps} - ${maxLaps}`, content);
		localFilters["Drivers"].updateCounter(`Maximum Drivers ${driversMin} - ${driversMax}`, content);

		// Save filters
		await ttStorage.change({
			filters: {
				racing: {
					hideRaces: hideRacesFilter,
					timeStart: timeStart,
					timeEnd: timeEnd,
					driversMin: driversMin,
					driversMax: driversMax,
					lapsMin: minLaps,
					lapsMax: maxLaps,
					track: trackFilter,
					name: nameFilter,
				},
			},
		});

		// Actual Filtering
		for (const li of document.findAll(".events-list > li")) {
			if (li.className === "clear") {
				continue;
			}
			/*************************************************/
			/**         Get data from racing page           **/
			/*************************************************/
			// Password
			const isProtected = li.classList.contains("protected");

			// No suitable cars enlisted
			const isIncompatible = li.classList.contains("no-suitable");

			// Fee
			const feeElement = li.querySelector("li.fee");

			let hasFee = false;
			if (feeElement) {
				const feeText = feeElement.textContent.replace(/\D/g, ""); // keep only digits
				const feeAmount = parseInt(feeText, 10);
				hasFee = feeAmount > 0;
			}

			// Drivers
			const driversElement = li.querySelector("li.drivers");

			let isFull = false;
			let maxDriversAllowed = 0;
			if (driversElement) {
				// Extract only numbers and slashes from the text
				const text = driversElement.textContent.replace(/\s+/g, ""); // remove whitespace
				// Match the pattern "number / number"
				const match = text.match(/(\d+)\/(\d+)/);

				if (match) {
					let driversJoined = 0;
					driversJoined = parseInt(match[1], 10);
					maxDriversAllowed = parseInt(match[2], 10);
					if (driversJoined >= maxDriversAllowed) {
						isFull = true;
					}
				}
			}

			// Laps
			const laps = parseInt(li.querySelector(".laps").textContent.match(/\d+/)[0], 10);

			// Start time
			const timeText = li.find(".event-wrap .startTime").textContent.trim(); // Format can be : "waiting", "26 m", "10 h 30 m"

			let totalHours = 0;
			if (!timeText || timeText.toLowerCase() === "waiting") {
				totalHours = -1;
			} else {
				// normalize text
				const cleanText = timeText.toLowerCase();

				// extract hours and minutes explicitly
				const hoursMatch = cleanText.match(/(\d+)\s*h/);
				const minsMatch = cleanText.match(/(\d+)\s*m/);

				const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
				const minutes = minsMatch ? parseInt(minsMatch[1], 10) : 0;

				// convert to whole hours
				totalHours = hours + Math.floor(minutes / 60);
			}

			// Track name
			const trackElement = li.querySelector("li.track");
			const trackName = Array.from(trackElement.childNodes)
				.filter((node) => node.nodeType === Node.TEXT_NODE)
				.map((node) => node.textContent.trim())
				.join(" ")
				.trim();

			// Race name
			const raceName = li.find(".event-wrap .name").textContent;

			/*************************************************/
			/**    Apply filters and update race list       **/
			/*************************************************/
			// Hide races
			if (hideRacesFilter.length && hideRacesFilter.includes("protected") && isProtected) {
				hideRow(li);
				continue;
			}
			if (hideRacesFilter.length && hideRacesFilter.includes("incompatible") && isIncompatible) {
				hideRow(li);
				continue;
			}
			if (hideRacesFilter.length && hideRacesFilter.includes("paid") && hasFee) {
				hideRow(li);
				continue;
			}
			if (hideRacesFilter.length && hideRacesFilter.includes("full") && isFull) {
				hideRow(li);
				continue;
			}

			// Max Drivers
			if (maxDriversAllowed < driversMin || maxDriversAllowed > driversMax) {
				hideRow(li);
				continue;
			}

			// Max Laps
			if (laps < minLaps || laps > maxLaps) {
				hideRow(li);
				continue;
			}

			// Start time
			if (timeStart === 0 && timeEnd === 0 && totalHours === -1) {
				// Don't hide races that are waiting
			} else if ((timeStart && totalHours < timeStart) || (timeEnd !== 48 && totalHours >= timeEnd)) {
				hideRow(li);
				continue;
			}

			// Track
			if (trackFilter != "" && !trackFilter.includes(trackName)) {
				hideRow(li);
				continue;
			}

			// Race name
			if (!raceName.toLowerCase().includes(nameFilter.toLowerCase())) {
				hideRow(li);
				continue;
			}

			showRow(li);
		}

		function showRow(li) {
			li.classList.remove("tt-hidden");
		}

		function hideRow(li) {
			li.classList.add("tt-hidden");
		}

		// Update statistics
		const allRaces = document.querySelectorAll(".events-list > li");
		localFilters["Statistics"].updateStatistics(
			[...allRaces].filter((li) => !li.classList.contains("tt-hidden") && li.className !== "clear").length,
			[...allRaces].filter((li) => li.className !== "clear").length,
			content
		);
	}

	function removeFilters() {
		removeContainer("Racing Filter");
		document.findAll(".events-list > li.tt-hidden").forEach((x) => x.classList.remove("tt-hidden"));
	}
})();

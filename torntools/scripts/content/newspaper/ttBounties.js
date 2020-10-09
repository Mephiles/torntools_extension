requireDatabase().then(() => {
	console.log("TT - Newspaper | Bounties");

	addXHRListener((event) => {
		const { page, xhr } = event.detail;
		if (page !== "bounties") return;

		const params = new URLSearchParams(xhr.requestBody);
		if (params.get("step") !== "mainBounties") return;

		bountiesLoaded().then(() => {
			addFilter(filters);

			if (settings.scripts.stats_estimate.global && settings.scripts.stats_estimate.bounties) showStatsEstimates();
		});
	});

	bountiesLoaded().then(() => {
		addFilter(filters);

		if (settings.scripts.stats_estimate.global && settings.scripts.stats_estimate.bounties) showStatsEstimates();
	});
});

function bountiesLoaded() {
	return requireElement(".bounties-list > li > ul > li .reward");
}

function addFilter(filters) {
	if (doc.find("#ttBountyContainer")) return;

	let container = content.newContainer("Bounty Filter", {
		header_only: true,
		id: "ttBountyContainer",
		next_element: doc.find(".bounties-total").nextElementSibling,
	});

	let option_1 = doc.new({ type: "div", class: "tt-checkbox-wrap in-title" });
	let checkbox_1 = doc.new({ type: "input", attributes: { type: "checkbox" } });
	let text_1 = doc.new({ type: "div", text: "Hide unavailable" });

	if (filters.bounties.hide_unavailable) {
		checkbox_1.checked = true;
	}

	option_1.appendChild(checkbox_1);
	option_1.appendChild(text_1);

	let option_2 = doc.new({ type: "div", class: "tt-input-wrap in-title" });
	let text_2 = doc.new({ type: "div", text: "Max level" });
	let input_2 = doc.new({ type: "input" });

	if (filters.bounties.max_level) {
		input_2.value = filters.bounties.max_level;
	}

	option_2.appendChild(text_2);
	option_2.appendChild(input_2);

	container.find(".tt-title .tt-options").appendChild(option_1);
	container.find(".tt-title .tt-options").appendChild(option_2);

	checkbox_1.onclick = applyFilters;
	input_2.onkeyup = applyFilters;

	applyFilters();

	function applyFilters() {
		let hide_unavailable = checkbox_1.checked;
		let max_level = input_2.value;

		for (let person of doc.findAll(".bounties-list > li:not(.clear):not(.tt-userinfo-container)")) {
			hideRow(person, false);

			// Unavailable
			if (hide_unavailable && person.find(".status .t-red")) {
				hideRow(person, true);
				continue;
			}

			// Max level
			let person_level = parseInt(person.find(".level").innerText.replace("Level:", ""));
			if (max_level && person_level > parseInt(max_level)) {
				hideRow(person, true);
			}
		}

		ttStorage.change({
			filters: {
				bounties: {
					hide_unavailable: hide_unavailable,
					max_level: parseInt(max_level),
				},
			},
		});

		function hideRow(row, hide) {
			const userinfoRow = row.nextElementSibling;
			if (hide) {
				row.classList.add("filter-hidden");

				if (userinfoRow && userinfoRow.classList && userinfoRow.classList.contains("tt-userinfo-container"))
					row.nextElementSibling.classList.add("filter-hidden");
			} else {
				row.classList.remove("filter-hidden");

				if (userinfoRow && userinfoRow.classList && userinfoRow.classList.contains("tt-userinfo-container"))
					row.nextElementSibling.classList.remove("filter-hidden");
			}
		}
	}
}

function showStatsEstimates() {
	estimateStatsInList(".bounties-list > li:not(.clear)", (row) => {
		return {
			userId: row
				.find(".head .target a")
				.getAttribute("href")
				.match(/profiles\.php\?XID=([0-9]*)/i)[1],
			level: parseInt(row.find(".level").innerText),
		};
	});
}

console.log("Loading Achievement Functions");

function displayAchievements(achievements, show_completed) {
	if (mobile) {
		let cont = doc.new({ type: "div" });
		let hidden_heading = doc.new({ type: "div", class: "tt-title", attributes: { style: "display: none;" } });
		let options = doc.new({ type: "div", class: "tt-options" });
		hidden_heading.appendChild(options);
		cont.appendChild(hidden_heading);
		body.appendChild(cont);

		addTimeToHeader(cont, torndata.date);

		return;
	}

	let awards_section = navbar.newSection("Awards", { next_element_heading: "Lists" });
	console.log(achievements);

	addTimeToHeader(awards_section, userdata.personalstats.date);
	createAchievementTooltip();
	achievements = fillGoals(achievements, torndata);

	// add achievements to awards section
	for (let name in achievements) {
		let current_stat = achievements[name].stats || 0;
		let next_goal = undefined;

		if (achievements[name].extra !== "###") next_goal = getNextGoal(current_stat, achievements[name]);

		if (next_goal === "completed" && !show_completed) continue;

		let achievement_text, new_cell;
		if (next_goal === "completed") {
			achievement_text = `${name}: Completed!`;
			new_cell = navbar.newCell(achievement_text, { parent_element: awards_section, class: "tt-completed" });
		} else {
			if (achievements[name].extra === "###") achievement_text = `${name}: ${numberWithCommas(current_stat)}`;
			else achievement_text = `${name}: ${numberWithCommas(current_stat)}/${numberWithCommas(next_goal)}`;

			new_cell = navbar.newCell(achievement_text, { parent_element: awards_section });
		}

		if (achievements[name].extra !== "###") {
			new_cell.setAttribute(
				"info",
				JSON.stringify({
					goals: achievements[name].goals,
					score: current_stat,
				})
			);
			// new_cell.setAttribute("info", `Goals: ${achievements[name].goals.map(x => " "+numberWithCommas(x))}\n Your score: ${numberWithCommas(current_stat)}`);
			addTooltip(new_cell);
		}
	}

	// if no content
	if (doc.findAll(".tt-nav-section div.tt-title+div *").length === 0) {
		awards_section.style.display = "none";
	}
}

function addTimeToHeader(section, date) {
	let span = doc.new("span");
	span.setClass("tt-awards-time");
	span.setAttribute("seconds", (new Date() - Date.parse(date)) / 1000);
	span.innerText = timeAgo(Date.parse(date));

	section.find("div.tt-title .tt-options").appendChild(span);

	// increment time
	setInterval(function () {
		let time_span = doc.find(".tt-awards-time");

		let seconds = parseInt(time_span.getAttribute("seconds"));
		time_span.innerText = timeAgo(new Date() - (seconds + 1) * 1000);
		time_span.setAttribute("seconds", seconds + 1);
	}, 1000);
}

function getNextGoal(stat, achievements) {
	let { goals, awarded } = achievements;
	let goal;
	goals = goals.sort((a, b) => a - b);

	for (let g of goals) {
		if (g > stat) {
			goal = g;
			break;
		}
	}

	if (!goal || goals.length === awarded.length) goal = "completed";

	return goal;
}

function fillGoals(achievements, torndata) {
	for (let name in achievements) {
		if (achievements[name].extra === "###") continue;

		let keyword = achievements[name].keyword;
		let inclusions = achievements[name].incl || [];
		let exclusions = achievements[name].excl || [];

		// loop through honors and medals
		for (let type of ["honors", "medals"]) {
			let merits = torndata[type];

			for (let key in merits) {
				let desc = merits[key].description.toLowerCase();

				if (desc.indexOf(keyword) > -1) {
					// keyword is present in desc.
					let includes = inclusions.length === 0;
					let excludes = exclusions.length === 0;

					// check for inclusions and exclusions
					for (let incl of inclusions) {
						includes = desc.indexOf(incl) > -1;
					}
					for (let excl of exclusions) {
						excludes = desc.indexOf(excl) === -1;
					}

					if (!(includes && excludes)) continue;

					// get goal
					desc = desc.split("for at least")[0]; // remove 'day' numbers from networth
					desc = desc.replace(/\D/g, ""); // replace all non-numbers
					let goal = parseInt(desc);

					if (!achievements[name].awarded) achievements[name].awarded = [];

					const awarded = userdata[`${type}_awarded`];
					if (awarded && awarded.includes(~~key)) achievements[name].stats = Math.max(achievements[name].stats, goal);

					if (!achievements[name].goals) achievements[name].goals = [goal];
					else if (!achievements[name].goals.includes(goal) && !isNaN(goal)) achievements[name].goals.push(goal);
				}
			}
		}
	}
	return achievements;
}

function createAchievementTooltip() {
	// create tooltip
	let div = doc.new({ type: "div", class: "tt-ach-tooltip" });
	let arrow = doc.new({ type: "div", class: "tt-ach-tooltip-arrow" });
	let text = doc.new({ type: "div", class: "tt-ach-tooltip-text" });

	div.appendChild(arrow);
	div.appendChild(text);
	doc.querySelector("body").appendChild(div);
}

function addTooltip(cell) {
	cell.addEventListener("mouseenter", function (event) {
		let position = event.target.getBoundingClientRect();

		let tooltip = doc.find(".tt-ach-tooltip");
		tooltip.style.left = String(position.x + 172 + 7) + "px";
		tooltip.style.top = String(position.y + Math.abs(document.body.getBoundingClientRect().y) + 6) + "px";
		tooltip.style.display = "block";
		tooltip.find(".tt-ach-tooltip-text").innerHTML = "";

		let data = JSON.parse(event.target.getAttribute("info"));
		let line_progress = doc.new({ type: "div", class: "line-progress" });
		tooltip.find(".tt-ach-tooltip-text").appendChild(line_progress);

		let added_user = false;
		for (let goal of data.goals) {
			if (goal > data.score && !added_user) {
				let div = doc.new({ type: "div", text: numberWithCommas(data.score) });
				let inner_div = doc.new({ type: "div", class: "point progress" });
				div.appendChild(inner_div);
				line_progress.appendChild(div);
				added_user = true;
			}

			if (goal !== data.score) {
				let div = doc.new({ type: "div", text: numberWithCommas(goal) });
				let inner_div = doc.new({ type: "div", class: "point" });
				div.appendChild(inner_div);
				line_progress.appendChild(div);
			}
		}

		if (!added_user) {
			let div = doc.new({ type: "div", text: numberWithCommas(data.score) });
			let inner_div = doc.new({ type: "div", class: "point progress" });
			div.appendChild(inner_div);
			line_progress.appendChild(div);
		}

		tooltip.find(".tt-ach-tooltip-text").appendChild(line_progress);
	});

	cell.addEventListener("mouseleave", function () {
		doc.find(".tt-ach-tooltip").style.display = "none";
	});
}

function getDonations() {
	return parseInt(doc.find("#church-donate .desc").innerText.split("donated")[1].split("to")[0].trim().replace(/,/g, "").replace("$", ""));
}

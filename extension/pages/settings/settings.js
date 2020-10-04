import changelog from "../../changelog.js";

let initiatedPages = {};

(() => {
	showPage(getSearchParameters().get("page") || "changelog");

	for (let navigation of document.findAll("header nav.on-page > ul > li")) {
		navigation.addEventListener("click", () => {
			showPage(navigation.getAttribute("to"));
		});
	}
})();

function showPage(name) {
	window.history.replaceState("", "Title", "?page=" + name);

	for (let active of document.findAll("body > main.active, header nav.on-page > ul > li.active"))
		active.classList.remove("active");

	document.find(`header nav.on-page > ul > li[to="${name}"]`).classList.add("active");
	document.find(`#${name}`).classList.add("active");

	let setup = {
		changelog: setupChangelog,
		preferences: setupPreferences,
		api_info: setupAPIInfo,
		remote: setupRemote,
		about: setupAbout,
	};

	if (!(name in initiatedPages) || !initiatedPages[name]) {
		setup[name]();
		initiatedPages[name] = true;
	}
}

function setupChangelog() {
	let content = document.find("#changelog > section");

	const contributorList = document.find("#changelog .contributors");
	for (let c in CONTRIBUTORS) {
		contributorList.appendChild(document.new({
			type: "div",
			class: `contributor ${c.toLowerCase()}`,
			html: `
				<span>
					<a href="https://www.torn.com/profiles.php?XID=${CONTRIBUTORS[c].id}" target="_blank">
						${CONTRIBUTORS[c].name} [${CONTRIBUTORS[c].id}]
					</a>
				</span>
			`,
		}));
	}

	for (let key in changelog) {
		const title = key.split(" - ")[1] ? " - " + key.split(" - ")[1] : "";
		const version = key.split(" - ")[0];

		let div = document.new({ type: "div", class: "parent" });

		// Heading
		let heading = document.new({ type: "div", class: "heading", text: version });
		let icon = document.new({ type: "i", class: "fas fa-chevron-down" });
		heading.appendChild(document.new({ type: "span", text: title }));
		heading.appendChild(icon);
		div.appendChild(heading);

		// Closeable
		let closeable = document.new({ type: "div", class: "closable hidden" });
		heading.addEventListener("click", () => {
			if (closeable.classList.contains("hidden")) closeable.classList.remove("hidden");
			else closeable.classList.add("hidden");

			rotateElement(icon, 180);
		});

		// Content
		for (let title in changelog[key]) {
			const parent = document.new({ type: "div", class: "parent", children: [document.new({ type: "div", class: "heading", text: title })] });

			for (let item of changelog[key][title]) {
				let contributor;

				for (let c in CONTRIBUTORS) {
					if (!item.includes(`- ${c}`)) continue;

					contributor = c.toLowerCase();
					item = item.slice(0, item.indexOf(`- ${c}`));
					break;
				}

				parent.appendChild(document.new({
					type: "div",
					class: `child ${contributor ? `contributor ${contributor}` : ""}`,
					children: [document.new({ type: "span", text: item })],
				}));
			}

			closeable.appendChild(parent);
		}

		// Bottom border on last element
		if (version === "v3") closeable.appendChild(document.new("hr"));

		// Finish
		div.appendChild(closeable);
		content.appendChild(div);

		if (Object.keys(changelog).indexOf(version + title) === 0) {
			heading.click();
			heading.style.color = "red";
		}
	}

	// Ending words
	content.appendChild(document.new({ type: "p", text: "The rest is history..", style: { textAlign: "center" } }));
}

function setupPreferences() {
	for (let link of document.findAll("#preferences > section > nav ul > li[name]")) {
		link.addEventListener("click", () => {
			document.find("#preferences > section > nav ul li[name].active").classList.remove("active");
			document.find("#preferences > section > .sections > section.active").classList.remove("active");

			link.classList.add("active");
			document.find(`#preferences > section > .sections > section[name="${link.getAttribute("name")}"]`).classList.add("active");
		});
	}
}

function setupAPIInfo() {
}

function setupRemote() {
}

function setupAbout() {
}
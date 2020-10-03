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

	for (let content of document.findAll(`body > main:not(#${name})`)) {
		content.classList.add("hidden");
	}
	for (let navigation of document.findAll("header nav.on-page > ul > li.active")) {
		navigation.classList.remove("active");
	}

	document.find(`header nav.on-page > ul > li[to="${name}"]`).parentElement.classList.add("active");
	document.find(`#${name}`).classList.remove("hidden");

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
	let content = document.find("#changelog .content");

	for (let ver in changelog) {
		let sub_ver = ver.split(" - ")[1] ? " - " + ver.split(" - ")[1] : "";
		ver = ver.split(" - ")[0];

		let div = document.new({ type: "div", class: "parent" });

		// Heading
		let heading = document.new({ type: "div", class: "heading", text: ver });
		let span = document.new({ type: "span", text: sub_ver });
		let icon = document.new({ type: "i", class: "fas fa-chevron-down" });
		heading.appendChild(span);
		heading.appendChild(icon);

		if (Object.keys(changelog).indexOf(ver + sub_ver) === 0) {
			heading.style.color = "red";
		}

		div.appendChild(heading);

		// Closeable
		let closeable = document.new("div");
		closeable.setClass("closeable");

		heading.addEventListener("click", () => {
			if (closeable.style.maxHeight) {
				closeable.style.maxHeight = null;
			} else {
				closeable.style.maxHeight = closeable.scrollHeight + "px";
			}

			rotateElement(icon, 180);
		});

		// Content
		if (Array.isArray(changelog[ver + sub_ver])) {
			for (let item of changelog[ver + sub_ver]) {
				let item_div = document.new("div");
				item_div.setClass("child");
				item_div.innerText = "- " + item;

				closeable.appendChild(item_div);
			}
		} else {
			(function loopKeyInChangelog(grandparent, parent_name, parent_element) {
				for (let _key in grandparent[parent_name]) {
					let _div = document.new("div");
					if (typeof grandparent[parent_name][_key] == "object") {
						_div.setClass("parent");
						let _heading = document.new("div");
						_heading.setClass("heading");
						_heading.innerText = _key;

						_div.appendChild(_heading);

						if (Array.isArray(grandparent[parent_name][_key])) {
							for (let _item of grandparent[parent_name][_key]) {
								let contributor;

								if (_item.includes("- DKK")) {
									contributor = "dkk";
									_item = _item.slice(0, _item.indexOf(" - DKK"));
								} else if (_item.includes("- Mephiles")) {
									contributor = "mephiles";
									_item = _item.slice(0, _item.indexOf(" - Mephiles"));
								} else if (_item.includes("- wootty2000")) {
									contributor = "wootty2000";
									_item = _item.slice(0, _item.indexOf(" - wootty2000"));
								}

								let _item_div = document.new({ type: "div", class: `child contributor ${contributor}` });
								let _item_span = document.new({ type: "span", text: _item });
								_item_div.appendChild(_item_span);
								_div.appendChild(_item_div);
							}
						} else {
							loopKeyInChangelog(grandparent[parent_name], _key, _div);
						}

					} else {
						_div.setClass("child");
						_div.innerText = grandparent[parent_name][_key];
					}
					parent_element.appendChild(_div);
				}
			})(changelog, ver + sub_ver, closeable);
		}

		// Bottom border on last element
		if (ver + sub_ver.split(" ")[0] === "v3") {
			let hr = document.new("hr");
			closeable.appendChild(hr);
		}

		// Finish
		div.appendChild(closeable);
		content.appendChild(div);

		if (Object.keys(changelog).indexOf(ver + sub_ver) === 0) {
			heading.click();
		}
	}

	// Ending words
	let p = document.new("p");
	p.innerText = "The rest is history..";
	p.style.textAlign = "center";

	content.appendChild(p);
}

function setupPreferences() {
}

function setupAPIInfo() {
}

function setupRemote() {
}

function setupAbout() {
}
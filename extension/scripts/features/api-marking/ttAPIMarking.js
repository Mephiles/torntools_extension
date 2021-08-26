"use strict";

(async () => {
	await loadDatabase();

	if (!settings.pages.api.marking) return;

	try {
		markSelections();
		markResponses();
	} catch (e) {
		console.error(e);
	}

	function markSelections() {
		for (const field of document.findAll(".panel-body > p[class*='_fields']")) {
			const type = getSection(field.classList[0].substring(0, 1));

			new MutationObserver((mutations, observer) => {
				observer.disconnect();

				toSpan(field);

				for (const selection of API_SELECTIONS[type]) {
					const span = field.find(`.selection[data-selection="${selection}"]`);
					if (!span) continue;

					span.classList.add("used");
				}
			}).observe(field, { childList: true });
		}

		function toSpan(field) {
			if (field.classList.contains("tt-modified")) return;

			field.classList.add("tt-modified");

			const selections = field.textContent
				.split(": ")
				.slice(1)
				.join(": ")
				.split(",")
				.map((selection) => selection.trim());

			const small = field.firstElementChild;

			small.innerHTML = "";
			small.appendChild(document.newElement({ type: "strong", text: "Available fields: " }));

			for (const selection of selections) {
				small.appendChild(document.newElement({ type: "span", text: selection, class: "selection", dataset: { selection } }));

				if (selections.indexOf(selection) !== selections.length - 1) {
					small.appendChild(document.createTextNode(", "));
				}
			}
		}
	}

	function markResponses() {
		for (const result of document.findAll(".panel-body > div[class*='_result']")) {
			const type = getSection(result.classList[0].substring(0, 1));

			new MutationObserver(() => {
				const responseElement = result.firstElementChild;

				const originalPre = responseElement.find("pre");
				originalPre.classList.add("original");

				const modifiedPre = document.newElement({ type: "pre", class: "modified active" });
				responseElement.insertBefore(modifiedPre, originalPre);

				try {
					populateResponse();
				} catch (error) {
					modifiedPre.appendChild(document.createTextNode("ERROR occurred!"));
					console.error(error);
				}
				createTabs();

				function populateResponse() {
					const response = JSON.parse(originalPre.textContent);

					modifiedPre.appendChild(document.newElement({ type: "span", text: "{" }));
					modifiedPre.appendChild(document.newElement("br"));
					loadResponse(response, API_USAGE[type], 1);
					modifiedPre.appendChild(document.newElement({ type: "span", text: "}" }));

					function loadResponse(response, marking, indent) {
						for (const [key, value] of Object.entries(response)) {
							if (typeof value === "object") {
								if (Array.isArray(value)) {
									modifiedPre.appendChild(
										document.newElement({ type: "span", class: key in marking ? "used" : "", text: `${getIndent(indent)}"${key}": [` })
									);
									modifiedPre.appendChild(document.newElement("br"));

									for (const item of value) {
										if (typeof item === "object") {
											if (Array.isArray(item)) {
												continue;
											} else if (item === null) {
												displayValue(key, null, indent, marking);
											} else {
												const toMark = marking === true || marking[key] === true || (key in marking ? "*" in marking[key] : false);
												const _marking = marking === true || marking[key] === true || (key in marking ? marking[key]["*"] || {} : {});

												modifiedPre.appendChild(
													document.newElement({ type: "span", class: toMark ? "used" : "", text: `${getIndent(indent + 1)}{` })
												);
												modifiedPre.appendChild(document.newElement("br"));
												loadResponse(item, _marking || {}, indent + 2);
												modifiedPre.appendChild(
													document.newElement({ type: "span", class: toMark ? "used" : "", text: `${getIndent(indent + 1)}},` })
												);
											}
										} else {
											displayValue(false, item, indent + 1, marking[key]);
										}
										modifiedPre.appendChild(document.newElement("br"));
									}

									modifiedPre.appendChild(
										document.newElement({ type: "span", class: key in marking ? "used" : "", text: `${getIndent(indent)}],` })
									);
								} else if (value === null) {
									displayValue(key, null, indent, marking);
								} else {
									const toMark = marking === true || key in marking || "*" in marking;

									modifiedPre.appendChild(
										document.newElement({ type: "span", class: toMark ? "used" : "", text: `${getIndent(indent)}"${key}": {` })
									);
									modifiedPre.appendChild(document.newElement("br"));
									loadResponse(value, marking[key] || marking["*"] || {}, indent + 1);
									modifiedPre.appendChild(document.newElement({ type: "span", class: toMark ? "used" : "", text: `${getIndent(indent)}},` }));
								}
							} else {
								displayValue(key, value, indent, marking);
							}
							modifiedPre.appendChild(document.newElement("br"));
						}

						function displayValue(key, value, indent, marking) {
							const marks = typeof value === "string";

							if (typeof value === "object") value = String(value);

							let display, shouldMark;
							if (key) {
								display = document.newElement({ type: "span", text: `${getIndent(indent)}"${key}": ${marks ? `"${value}"` : value},` });
								shouldMark = marking === true || key in marking || "*" in marking;
							} else {
								display = document.newElement({ type: "span", text: `${getIndent(indent)}${marks ? `"${value}"` : value},` });
								shouldMark = marking;
							}
							if (shouldMark) display.classList.add("used");
							modifiedPre.appendChild(display);
						}
					}
				}

				function createTabs() {
					const original = document.newElement({ type: "div", class: "response-tab", text: "Original" });
					const modified = document.newElement({ type: "div", class: "response-tab active", text: "Modified" });

					original.addEventListener("click", () => {
						[original, originalPre].forEach((x) => x.classList.add("active"));
						[modified, modifiedPre].forEach((x) => x.classList.remove("active"));
					});
					modified.addEventListener("click", () => {
						[modified, modifiedPre].forEach((x) => x.classList.add("active"));
						[original, originalPre].forEach((x) => x.classList.remove("active"));
					});

					responseElement.insertBefore(document.newElement({ type: "div", class: "response-tabs", children: [original, modified] }), modifiedPre);
				}
			}).observe(result, { childList: true });
		}

		function getIndent(level) {
			let indent = "";

			for (let i = 0; i < level; i++) {
				indent += "        ";
			}

			return indent;
		}
	}

	function getSection(char) {
		switch (char) {
			case "u":
				return "user";
			case "p":
				return "properties";
			case "f":
				return "faction";
			case "c":
				return "company";
			case "i":
				return "item_market";
			case "t":
				return "torn";
			default:
				return "user";
		}
	}
})();

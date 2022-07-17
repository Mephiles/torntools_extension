"use strict";

const rotatingElements = {};
let mobile;
let tablet;

Object.defineProperty(Document.prototype, "newElement", {
	value(options = {}) {
		if (typeof options === "string") {
			return this.createElement(options);
		} else if (typeof options === "object") {
			options = {
				type: "div",
				id: false,
				class: false,
				text: false,
				html: false,
				value: false,
				href: false,
				children: [],
				attributes: {},
				events: {},
				style: {},
				dataset: {},
				...options,
			};

			const newElement = this.createElement(options.type);

			if (options.id) newElement.id = options.id;
			if (options.class) {
				if (Array.isArray(options.class)) newElement.setClass(...options.class.filter((name) => !!name));
				else newElement.setClass(options.class.trim());
			}
			if (options.text !== false) newElement.textContent = options.text;
			if (options.html) newElement.innerHTML = options.html;
			if (options.value) {
				if (typeof options.value === "function") newElement.value = options.value();
				else newElement.value = options.value;
			}
			if (options.href) newElement.href = options.href;

			for (const child of options.children || []) {
				if (typeof child === "string") {
					newElement.appendChild(document.createTextNode(child));
				} else {
					newElement.appendChild(child);
				}
			}

			if (options.attributes) {
				let attributes = options.attributes;
				if (typeof attributes === "function") attributes = attributes();

				for (const attribute in attributes) newElement.setAttribute(attribute, attributes[attribute]);
			}
			for (const event in options.events) newElement.addEventListener(event, options.events[event]);

			for (const key in options.style) newElement.style[key] = options.style[key];
			for (const key in options.dataset) {
				if (typeof options.dataset[key] === "object") newElement.dataset[key] = JSON.stringify(options.dataset[key]);
				else newElement.dataset[key] = options.dataset[key];
			}

			return newElement;
		}
	},
	enumerable: false,
});

Object.defineProperty(DOMTokenList.prototype, "contains", {
	value(className) {
		const classes = [...this];
		if (className.startsWith("^=")) {
			className = className.substring(2, className.length);

			for (const name of classes) {
				if (!name.startsWith(className)) continue;

				return true;
			}
			return false;
		} else {
			return classes.includes(className);
		}
	},
	enumerable: false,
});
Object.defineProperty(DOMTokenList.prototype, "removeSpecial", {
	value(className) {
		const classes = [...this];
		if (className.startsWith("^=")) {
			className = className.substring(2, className.length);

			for (const name of classes) {
				if (!name.startsWith(className)) continue;

				this.remove(name);
				break;
			}
		} else {
			this.remove(className);
		}
	},
	enumerable: false,
});

function _find(element, selector, options = {}) {
	options = {
		text: false,
		...options,
	};

	if (options.text) {
		for (const element of document.querySelectorAll(selector)) {
			if (element.textContent === options.text) {
				return element;
			}
		}
	}

	if (selector.includes("=") && !selector.includes("[")) {
		const key = selector.split("=")[0];
		const value = selector.split("=")[1];

		for (const element of document.querySelectorAll(key)) {
			if (element.textContent.trim() === value.trim()) {
				return element;
			}
		}

		try {
			element.querySelector(selector);
		} catch (err) {
			return undefined;
		}
	}
	return element.querySelector(selector);
}

Object.defineProperty(Document.prototype, "find", {
	value(selector, options = {}) {
		return _find(this, selector, options);
	},
	enumerable: false,
});
Object.defineProperty(Element.prototype, "find", {
	value(selector, options = {}) {
		return _find(this, selector, options);
	},
	enumerable: false,
});

Object.defineProperty(Document.prototype, "findAll", {
	value(selector) {
		return this.querySelectorAll(selector);
	},
	enumerable: false,
});
Object.defineProperty(Element.prototype, "findAll", {
	value(selector) {
		return this.querySelectorAll(selector);
	},
	enumerable: false,
});

Object.defineProperty(Document.prototype, "setClass", {
	value(...classNames) {
		this.setAttribute("class", classNames.join(" "));
	},
	enumerable: false,
});
Object.defineProperty(Element.prototype, "setClass", {
	value(...classNames) {
		this.setAttribute("class", classNames.join(" "));
	},
	enumerable: false,
});

function checkDevice() {
	return new Promise((resolve) => {
		if (typeof mobile === "boolean" && typeof tablet === "boolean") return resolve({ mobile, tablet });

		if (document.readyState === "complete" || document.readyState === "interactive") check();
		else window.addEventListener("DOMContentLoaded", check);

		function check() {
			const innerWidth = window.innerWidth;
			mobile = innerWidth <= 600;
			tablet = innerWidth <= 960 && innerWidth >= 600;

			resolve({ mobile, tablet });
		}
	});
}

function getSearchParameters(input) {
	if (!input) input = location.href;

	try {
		return new URL(input).searchParams;
	} catch (e) {
		return new URL(location.href).searchParams;
	}
}

function getHashParameters(hash) {
	if (!hash) hash = location.hash;

	if (hash.startsWith("#/")) hash = hash.substring(2);
	else if (hash.startsWith("#") || hash.startsWith("/")) hash = hash.substring(1);

	if (!hash.startsWith("!")) hash = "?" + hash;

	return new URLSearchParams(hash);
}

function findParent(element, options = {}) {
	options = {
		tag: false,
		class: false,
		id: false,
		hasAttribute: false,
		...options,
	};

	if (!element || !element.parentElement) return undefined;

	if (options.tag && element.parentElement.tagName === options.tag) return element.parentElement;
	if (
		options.class &&
		((Array.isArray(options.class) && options.class.some((c) => element.parentElement.classList.contains(c))) ||
			(!Array.isArray(options.class) && element.parentElement.classList.contains(options.class)))
	)
		return element.parentElement;
	if (options.hasAttribute && element.parentElement.getAttribute(options.hasAttribute) !== null) return element.parentElement;

	return findParent(element.parentElement, options);
}

function rotateElement(element, degrees) {
	let uuid;
	if (element.hasAttribute("rotate-id")) uuid = element.getAttribute("rotate-id");
	else {
		uuid = getUUID();
		element.setAttribute("rotate-id", uuid);
	}

	if (rotatingElements[uuid]) {
		clearInterval(rotatingElements[uuid].interval);
		element.style.transform = `rotate(${rotatingElements[uuid].totalDegrees}deg)`;
	}

	const startDegrees = (element.style.transform ? parseInt(element.style.transform.replace("rotate(", "").replace("deg)", "")) : 0) % 360;
	element.style.transform = `rotate(${startDegrees}deg)`;

	const totalDegrees = startDegrees + degrees;
	const step = 1000 / degrees;

	rotatingElements[uuid] = {
		interval: setInterval(function () {
			const currentRotation = element.style.transform ? parseInt(element.style.transform.replace("rotate(", "").replace("deg)", "")) : 0;
			let newRotation = currentRotation + step;

			if (currentRotation < totalDegrees && newRotation > totalDegrees) {
				newRotation = totalDegrees;
				clearInterval(rotatingElements[uuid].interval);
			}

			element.style.transform = `rotate(${newRotation}deg)`;
		}, 1),
		totalDegrees,
	};
}

function sortTable(table, columnPlace, order) {
	const header = table.find(`th:nth-child(${columnPlace}), .row.header > :nth-child(${columnPlace})`);
	const icon = header.find("i");
	if (order) {
		if (icon) {
			switch (order) {
				case "asc":
					icon.classList.add("fa-caret-up");
					icon.classList.remove("fa-caret-down");
					break;
				case "desc":
					icon.classList.add("fa-caret-down");
					icon.classList.remove("fa-caret-up");
					break;
				case "none":
				default:
					icon.remove();
					break;
			}
		} else {
			switch (order) {
				case "asc":
					header.appendChild(document.newElement({ type: "i", class: "fas fa-caret-up" }));
					break;
				case "desc":
					header.appendChild(document.newElement({ type: "i", class: "fas fa-caret-down" }));
					break;
			}
		}
	} else if (icon) {
		if (icon.classList.contains("fa-caret-down")) {
			icon.classList.add("fa-caret-up");
			icon.classList.remove("fa-caret-down");

			order = "asc";
		} else if (icon.classList.contains("fa-caret-up")) {
			icon.classList.add("fa-caret-down");
			icon.classList.remove("fa-caret-up");

			order = "desc";
		}
	} else {
		header.appendChild(document.newElement({ type: "i", class: "fas fa-caret-up" }));

		order = "asc";
	}
	for (const h of table.findAll("th, .row.header > *")) {
		if (h === header) continue;

		if (h.find("i")) h.find("i").remove();
	}

	let rows;
	if (!table.find("tr:not(.heading), .row:not(.header)")) rows = [];
	else {
		rows = [...table.findAll("tr:not(.header), .row:not(.header)")];
		rows = sortRows(rows);
	}

	for (const row of rows) table.appendChild(row);

	function sortRows(rows) {
		if (order === "asc") {
			rows.sort((a, b) => {
				const helper = sortHelper(a, b);

				return helper.a - helper.b;
			});
		} else if (order === "desc") {
			rows.sort((a, b) => {
				const helper = sortHelper(a, b);

				return helper.b - helper.a;
			});
		}

		return rows;

		function sortHelper(elementA, elementB) {
			elementA = elementA.find(`:scope > *:nth-child(${columnPlace})`);
			elementB = elementB.find(`:scope > *:nth-child(${columnPlace})`);

			let valueA, valueB;
			if (elementA.hasAttribute("sort-type")) {
				switch (elementA.getAttribute("sort-type")) {
					case "date":
						valueA = elementA.getAttribute("value");
						valueB = elementB.getAttribute("value");

						if (Date.parse(valueA)) valueA = Date.parse(valueA);
						if (Date.parse(valueB)) valueA = Date.parse(valueB);
						break;
					case "css-dataset":
						valueA =
							elementA.dataset[
								getComputedStyle(elementA)
									.getPropertyValue("--currentValue")
									.match(/attr\(data-(.*)\)/i)[1]
							];
						valueB =
							elementB.dataset[
								getComputedStyle(elementB)
									.getPropertyValue("--currentValue")
									.match(/attr\(data-(.*)\)/i)[1]
							];
						break;
					default:
						console.warn("Attempting to sort by a non-existing type.", elementA.getAttribute("sort-type"));
						return;
				}
			} else if (elementA.hasAttribute("value")) {
				valueA = elementA.getAttribute("value");
				valueB = elementB.getAttribute("value");
			} else {
				valueA = elementA.textContent;
				valueB = elementB.textContent;
			}

			let a, b;
			if (isNaN(parseFloat(valueA))) {
				if (valueA.includes("$")) {
					a = parseFloat(valueA.replace("$", "").replace(/,/g, ""));
					b = parseFloat(valueB.replace("$", "").replace(/,/g, ""));
				} else {
					a = valueA.toLowerCase().localeCompare(valueB.toLowerCase());
					b = 0;
				}
			} else {
				a = parseFloat(valueA);
				b = parseFloat(valueB);
			}

			return { a, b };
		}
	}
}

function showLoadingPlaceholder(element, show) {
	const placeholder = element.find(".tt-loading-placeholder");

	if (show) {
		if (placeholder) {
			placeholder.classList.add("active");
		} else {
			element.appendChild(
				document.newElement({
					type: "div",
					class: "tt-loading-placeholder active",
				})
			);
		}
	} else if (placeholder) {
		placeholder.classList.remove("active");
	}
}

function executeScript(handler, code) {
	if (window.wrappedJSObject && handler) handler(window.wrappedJSObject);
	else {
		const script = document.newElement({
			type: "script",
			attributes: { type: "text/javascript" },
			html: code,
		});

		document.head.appendChild(script);
		setTimeout(() => script.remove(), 100);
	}
}

function updateQuery(key, value) {
	if (history.pushState) {
		const url = new URL(location.href);
		const params = url.searchParams;

		params.set(key, value);

		history.pushState({ path: url.toString() }, "", url.toString());
	}
}

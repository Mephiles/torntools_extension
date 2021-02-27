"use strict";

let rotatingElements = {};
let mobile;

Document.prototype.newElement = function (options = {}) {
	if (typeof options == "string") {
		return this.createElement(options);
	} else if (typeof options == "object") {
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
			...options,
		};

		let newElement = this.createElement(options.type);

		if (options.id) newElement.id = options.id;
		if (options.class) newElement.setClass(options.class);
		if (options.text) newElement.innerText = options.text;
		if (options.html) newElement.innerHTML = options.html;
		if (options.value) {
			if (typeof options.value === "function") newElement.value = options.value();
			else newElement.value = options.value;
		}
		if (options.href) newElement.href = options.href;

		for (let child of options.children || []) {
			if (typeof child === "string") {
				newElement.appendChild(document.createTextNode(child));
			} else {
				newElement.appendChild(child);
			}
		}

		if (options.attributes) {
			let attributes = options.attributes;
			if (typeof attributes === "function") attributes = attributes();

			for (let attribute in attributes) newElement.setAttribute(attribute, attributes[attribute]);
		}
		for (let event in options.events) newElement.addEventListener(event, options.events[event]);

		for (let key in options.style) newElement.style[key] = options.style[key];
		for (let key in options.dataset) newElement.dataset[key] = options.dataset[key];

		return newElement;
	}
};

DOMTokenList.prototype.contains = function (className) {
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
};

function _find(element, selector, options = {}) {
	options = {
		text: false,
		...options,
	};

	if (options.text) {
		for (const element of document.querySelectorAll(selector)) {
			if (element.innerText === options.text) {
				return element;
			}
		}
	}

	if (selector.includes("=") && !selector.includes("[")) {
		const key = selector.split("=")[0];
		const value = selector.split("=")[1];

		for (let element of document.querySelectorAll(key)) {
			if (element.innerText === value) {
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

Document.prototype.find = function (selector, options = {}) {
	return _find(this, selector, options);
};
Element.prototype.find = function (selector, options = {}) {
	return _find(this, selector, options);
};

Document.prototype.findAll = function (selector) {
	return this.querySelectorAll(selector);
};
Element.prototype.findAll = function (selector) {
	return this.querySelectorAll(selector);
};

Document.prototype.setClass = function (...classNames) {
	this.setAttribute("class", classNames.join(" "));
};
Element.prototype.setClass = function (...classNames) {
	this.setAttribute("class", classNames.join(" "));
};

function checkMobile() {
	return new Promise((resolve) => {
		if (typeof mobile === "boolean") return resolve(mobile);

		if (document.readyState === "complete" || document.readyState === "interactive") check();
		else window.addEventListener("DOMContentLoaded", check);

		function check() {
			mobile = window.innerWidth <= 600;

			resolve(mobile);
		}
	});
}

function getSearchParameters() {
	return new URL(window.location).searchParams;
}

function getHashParameters() {
	let hash = window.location.hash;

	if (hash.startsWith("#/")) hash = hash.substring(2);
	else if (hash.startsWith("#") || hash.startsWith("/")) hash = hash.substring(1);

	if (!hash.startsWith("!")) hash = "?" + hash;

	return new URLSearchParams(hash);
}

function hasParent(element, options = {}) {
	options = {
		class: false,
		id: false,
		...options,
	};

	if (!element.parentElement) return false;

	if (options.class && element.parentElement.classList.contains(options.class)) return true;
	if (options.id && element.parentElement.id === options.id) return true;

	return hasParent(element.parentElement, options);
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

	let startDegrees = (element.style.transform ? parseInt(element.style.transform.replace("rotate(", "").replace("deg)", "")) : 0) % 360;
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
	let header = table.find(`th:nth-child(${columnPlace})`);
	if (order) {
		if (header.find("i")) {
			switch (order) {
				case "asc":
					header.find("i.fa-caret-down").classList.add("fa-caret-up");
					header.find("i.fa-caret-down").classList.remove("fa-caret-down");
					break;
				case "desc":
					header.find("i.fa-caret-up").classList.add("fa-caret-down");
					header.find("i.fa-caret-up").classList.remove("fa-caret-up");
					break;
				case "none":
				default:
					header.find("i").remove();
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
	} else if (header.find("i.fa-caret-down")) {
		header.find("i.fa-caret-down").classList.add("fa-caret-up");
		header.find("i.fa-caret-down").classList.remove("fa-caret-down");

		order = "asc";
	} else if (header.find("i.fa-caret-up") || order === "desc") {
		header.find("i.fa-caret-up").classList.add("fa-caret-down");
		header.find("i.fa-caret-up").classList.remove("fa-caret-up");

		order = "desc";
	} else {
		header.appendChild(document.newElement({ type: "i", class: "fas fa-caret-up" }));

		order = "asc";
	}
	for (let h of table.findAll("th")) {
		if (h === header) continue;

		if (h.find("i")) h.find("i").remove();
	}

	let rows;
	if (!table.find("tr:not(.heading)")) rows = [];
	else {
		rows = [...table.findAll("tr:not(.header)")];
		rows = sortRows(rows);
	}

	for (let row of rows) table.appendChild(row);

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
			elementA = elementA.find(`*:nth-child(${columnPlace})`);
			elementB = elementB.find(`*:nth-child(${columnPlace})`);

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
				valueA = elementA.innerText;
				valueB = elementB.innerText;
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
	if (show) {
		if (element.find(".tt-loading-placeholder")) {
			element.find(".tt-loading-placeholder").classList.add("active");
		} else {
			element.appendChild(
				document.newElement({
					type: "img",
					class: "ajax-placeholder mt10 mb10 tt-loading-placeholder active", // FIXME - Don't use Torn classes.
					attributes: { src: "https://www.torn.com/images/v2/main/ajax-loader.gif" },
				})
			);
		}
	} else {
		element.find(".tt-loading-placeholder").classList.remove("active");
	}
}

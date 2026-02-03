const rotatingElements: Record<string, { interval: number; totalDegrees: number }> = {};
let mobile: boolean, tablet: boolean, hasSidebar: boolean;

interface ElementBuilderOptions {
	id?: string;
	class?: string | string[];
	text?: string | number;
	html?: string;
	value?: any | (() => any);
	href?: string;
	children?: (string | Node)[];
	attributes?: Record<string, string | number | boolean> | (() => Record<string, string | number | boolean>);
	events?: Partial<{ [E in keyof GlobalEventHandlersEventMap]: (e: GlobalEventHandlersEventMap[E]) => void }>;
	style?: { [P in keyof CSSStyleDeclaration as P extends string ? (CSSStyleDeclaration[P] extends string ? P : never) : never]?: CSSStyleDeclaration[P] };
	dataset?: {
		[name: string]: string | object | boolean | number;
	};
}

function elementBuilder<K extends keyof HTMLElementTagNameMap>(tagName: K): HTMLElementTagNameMap[K];
function elementBuilder<K extends keyof HTMLElementTagNameMap>(options: ElementBuilderOptions & { type: K }): HTMLElementTagNameMap[K];

function elementBuilder<K extends keyof HTMLElementTagNameMap>(options: K | (ElementBuilderOptions & { type: K })): HTMLElementTagNameMap[K] {
	if (typeof options === "string") {
		return document.createElement(options);
	} else if (typeof options === "object") {
		options = {
			type: "div",
			id: undefined,
			class: undefined,
			text: undefined,
			html: undefined,
			value: undefined,
			href: undefined,
			children: [],
			attributes: {},
			events: {},
			style: {},
			dataset: {},
			...options,
		};

		const newElement = document.createElement(options.type);

		if (options.id) newElement.id = options.id;
		if (options.class) {
			if (Array.isArray(options.class)) newElement.setClass(...options.class.filter((name) => !!name));
			else newElement.setClass(options.class.trim());
		}
		if (options.text !== undefined) newElement.textContent = options.text.toString();
		if (options.html) newElement.innerHTML = options.html;
		if (options.value && "value" in newElement) {
			if (typeof options.value === "function") newElement.value = options.value();
			else newElement.value = options.value;
		}
		if (options.href && "href" in newElement) newElement.href = options.href;

		for (const child of options.children.filter((child) => !!child) || []) {
			if (typeof child === "string") {
				newElement.appendChild(document.createTextNode(child));
			} else {
				newElement.appendChild(child);
			}
		}

		if (options.attributes) {
			let attributes = options.attributes;
			if (typeof attributes === "function") attributes = attributes();

			for (const attribute in attributes) newElement.setAttribute(attribute, attributes[attribute].toString());
		}
		for (const event in options.events) newElement.addEventListener(event, options.events[event]);

		for (const key in options.style) newElement.style[key] = options.style[key];
		for (const key in options.dataset) {
			if (typeof options.dataset[key] === "object") newElement.dataset[key] = JSON.stringify(options.dataset[key]);
			else newElement.dataset[key] = options.dataset[key].toString();
		}

		return newElement;
	} else {
		throw new Error("Invalid options provided to newElement.");
	}
}

Object.defineProperty(DOMTokenList.prototype, "contains", {
	value(this: DOMTokenList, className: string): boolean {
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
	value(this: DOMTokenList, className: string): void {
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

function _find(element: ParentNode, selector: string, options: Partial<FindOptions> = {}): Element {
	options = {
		text: undefined,
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
	value(this: Document, selector: string, options: Partial<FindOptions> = {}): Element {
		return _find(this, selector, options);
	},
	enumerable: false,
});
Object.defineProperty(Element.prototype, "find", {
	value(this: Element, selector: string, options: Partial<FindOptions> = {}): Element {
		return _find(this, selector, options);
	},
	enumerable: false,
});

function findAllElements<K extends keyof HTMLElementTagNameMap>(tagName: K, parent?: ParentNode): HTMLElementTagNameMap[K][];
function findAllElements<T extends Element = HTMLElement>(selector: string, parent?: ParentNode): T[];

function findAllElements(selector: string, parent: ParentNode = document): Element[] {
	return Array.from(parent.querySelectorAll(selector));
}

Object.defineProperty(Document.prototype, "setClass", {
	value(this: Element, ...classNames: string[]) {
		this.setAttribute("class", classNames.join(" "));
	},
	enumerable: false,
});
Object.defineProperty(Element.prototype, "setClass", {
	value(this: Element, ...classNames: string[]) {
		this.setAttribute("class", classNames.join(" "));
	},
	enumerable: false,
});

interface DeviceInformation {
	mobile: boolean;
	tablet: boolean;
	tabletHorizontal: boolean;
	tabletVertical: boolean;
	hasSidebar: boolean;
}

function checkDevice() {
	return new Promise<DeviceInformation>((resolve) => {
		if (document.readyState === "complete" || document.readyState === "interactive") check();
		else window.addEventListener("DOMContentLoaded", check);

		function check() {
			const innerWidth = window.innerWidth;
			mobile = innerWidth <= 600;
			tablet = innerWidth <= 1000 && innerWidth >= 600;
			hasSidebar = innerWidth > 1000;
			const tabletHorizontal = tablet && innerWidth >= 784;

			resolve({ mobile, tablet, tabletHorizontal, tabletVertical: tablet && !tabletHorizontal, hasSidebar });
		}
	});
}

function getSearchParameters(input?: string) {
	if (!input) input = location.href;

	try {
		return new URL(input).searchParams;
	} catch (e) {
		return new URL(location.href).searchParams;
	}
}

function getHashParameters(hash?: string) {
	if (!hash) hash = location.hash;

	if (hash.startsWith("#/")) hash = hash.substring(2);
	else if (hash.startsWith("#") || hash.startsWith("/")) hash = hash.substring(1);

	if (!hash.startsWith("!")) hash = "?" + hash;

	return new URLSearchParams(hash);
}

interface FindParentOptions {
	tag: string;
	class: string;
	id: string;
	hasAttribute: string;
	maxAttempts: number;
	currentAttempt: number;
}

function findParent(element: Node, options: Partial<FindParentOptions> = {}) {
	options = {
		tag: undefined,
		class: undefined,
		id: undefined,
		hasAttribute: undefined,
		maxAttempts: -1,
		currentAttempt: 1,
		...options,
	};

	if (!element || !element.parentElement) return undefined;
	if (options.maxAttempts !== -1 && options.currentAttempt > options.maxAttempts) return undefined;

	if (options.tag && element.parentElement.tagName === options.tag) return element.parentElement;
	if (options.id && element.parentElement.id === options.id) return element.parentElement;
	if (
		options.class &&
		((Array.isArray(options.class) && options.class.some((c) => element.parentElement.classList.contains(c))) ||
			(!Array.isArray(options.class) && element.parentElement.classList.contains(options.class)))
	)
		return element.parentElement;
	if (options.hasAttribute && element.parentElement.getAttribute(options.hasAttribute) !== null) return element.parentElement;

	return findParent(element.parentElement, { ...options, currentAttempt: options.currentAttempt + 1 });
}

function rotateElement(element: HTMLElement, degrees: number) {
	let uuid: string;
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

type TableSortOrder = "asc" | "desc" | "none";

function sortTable(table: HTMLElement, columnPlace: number, order?: TableSortOrder) {
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
					header.appendChild(elementBuilder({ type: "i", class: "fa-solid fa-caret-up" }));
					break;
				case "desc":
					header.appendChild(elementBuilder({ type: "i", class: "fa-solid fa-caret-down" }));
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
		header.appendChild(elementBuilder({ type: "i", class: "fa-solid fa-caret-up" }));

		order = "asc";
	}

	table.dataset.ttSortColumn = columnPlace.toString();
	table.dataset.ttSortOrder = order;

	for (const h of findAllElements("th, .row.header > *", table)) {
		if (h === header) continue;

		if (h.find("i")) h.find("i").remove();
	}

	let rows: HTMLElement[];
	if (!table.find("tr:not(.heading), .row:not(.header)")) rows = [];
	else {
		rows = findAllElements<HTMLElement>("tr:not(.header), .row:not(.header)", table);
		rows = sortRows(rows);
	}

	for (const row of rows) table.appendChild(row);

	function sortRows(rows: HTMLElement[]) {
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

		function sortHelper(elementA: HTMLElement, elementB: HTMLElement) {
			elementA = elementA.find(`:scope > *:nth-child(${columnPlace})`);
			elementB = elementB.find(`:scope > *:nth-child(${columnPlace})`);

			let valueA: string, valueB: string;
			if (elementA.hasAttribute("sort-type")) {
				switch (elementA.getAttribute("sort-type")) {
					case "date":
						valueA = elementA.getAttribute("value");
						valueB = elementB.getAttribute("value");

						if (Date.parse(valueA)) valueA = Date.parse(valueA).toString();
						if (Date.parse(valueB)) valueA = Date.parse(valueB).toString();
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
						return { a: 0, b: 0 }; // Keep original sorting order this way.
				}
			} else if (elementA.hasAttribute("value")) {
				valueA = elementA.getAttribute("value");
				valueB = elementB.getAttribute("value");
			} else {
				valueA = elementA.textContent;
				valueB = elementB.textContent;
			}

			let a: number, b: number;
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

function resortTable(table: HTMLElement) {
	if (!("ttSortColumn" in table.dataset) || !("ttSortOrder" in table.dataset)) return;

	const column = parseInt(table.dataset.ttSortColumn);
	const order = table.dataset.ttSortOrder as TableSortOrder;

	sortTable(table, column, order);
}

function showLoadingPlaceholder(element: HTMLElement, show: boolean) {
	const placeholder = element.find(".tt-loading-placeholder");

	if (show) {
		if (placeholder) {
			placeholder.classList.add("active");
		} else {
			element.appendChild(
				elementBuilder({
					type: "div",
					class: "tt-loading-placeholder active",
				})
			);
		}
	} else if (placeholder) {
		placeholder.classList.remove("active");
	}
}

function executeScript(filename: string, remove = true) {
	const script = elementBuilder({
		type: "script",
		attributes: {
			type: "text/javascript",
			src: filename,
		},
	});

	requireCondition(() => !!document.head).then(() => {
		document.head.appendChild(script);

		if (remove) setTimeout(() => script.remove(), 2000);
	});
}

function updateQuery(key: string, value: string) {
	if (history.pushState) {
		const url = new URL(location.href);
		const params = url.searchParams;

		params.set(key, value);

		history.pushState({ path: url.toString() }, "", url.toString());
	}
}

async function addInformationSection() {
	if (document.find(".tt-sidebar-information")) return;

	const parent = await requireElement("#sidebarroot div[class*='user-information_'] div[class*='toggle-content_'] div[class*='content_']");

	parent.appendChild(
		elementBuilder({
			type: "hr",
			class: "tt-sidebar-information-divider tt-delimiter tt-hidden",
		})
	);
	parent.appendChild(elementBuilder({ type: "div", class: "tt-sidebar-information tt-hidden" }));
}

function showInformationSection() {
	document.find(".tt-sidebar-information-divider")?.classList.remove("tt-hidden");
	document.find(".tt-sidebar-information")?.classList.remove("tt-hidden");
}

function isElement(node: Node | EventTarget | null): node is Element {
	return node && "nodeType" in node && node.nodeType === Node.ELEMENT_NODE && typeof (node as Element).className === "string";
}

function isTextNode(node: Node): node is Text {
	return node.nodeType === Node.TEXT_NODE;
}

function isHTMLElement(node: Node | EventTarget): node is HTMLElement {
	return isElement(node) && "dataset" in node && "title" in node;
}
function isElementOfTag<K extends keyof HTMLElementTagNameMap>(node: Node | EventTarget, tag: K): node is HTMLElementTagNameMap[K] {
	return isHTMLElement(node) && node.tagName.toLowerCase() === tag;
}

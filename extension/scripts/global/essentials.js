console.log("TT2 - Loading essential data.");

/*
 * Classes.
 */

class TTStorage {
	get(key) {
		return new Promise(resolve => {
			if (Array.isArray(key)) {
				chrome.storage.local.get(key, data => resolve(key.map(i => data[i])));
			} else if (key) {
				chrome.storage.local.get([key], data => resolve(data[key]));
			} else {
				chrome.storage.local.get(null, data => resolve(data));
			}
		});
	}

	set(object) {
		return new Promise(resolve => {
			chrome.storage.local.set(object, function () {
				resolve();
			});
		});
	}

	clear() {
		return new Promise(resolve => {
			chrome.storage.local.clear(function () {
				resolve();
			});
		});
	}

	change(object) {
		return new Promise(async resolve => {
			for (let key of Object.keys(object)) {
				const data = recursive(await this.get(key), object[key]);

				function recursive(parent, toChange) {
					for (let key in toChange) {
						if (parent && key in parent && typeof toChange[key] === "object" && !Array.isArray(toChange[key])) {
							parent[key] = recursive(parent[key], toChange[key]);
						} else if (parent) {
							parent[key] = toChange[key];
						} else {
							parent = { [key]: toChange[key] };
						}
					}
					return parent;
				}

				await this.set({ [key]: data });
			}
			resolve();
		});
	}

	reset() {
		return new Promise(async resolve => {
			const apiKey = await this.get("api_key");

			await this.clear();
			await this.set(DEFAULT_STORAGE);
			await this.set("api_key", apiKey);

			console.log("Storage cleared");
			console.log("New storage", await this.get());

			resolve();
		});
	}
}

const ttStorage = new TTStorage();

/*
 * Some data variables.
 */

const LOADING_STATUSES = {
	NOT_INITIALIZED: 0,
	LOADING: 1,
	LOADED: 2,
	ENTRY: 3,
	FAILED: 99,
};

let loadingStatus = LOADING_STATUSES.NOT_INITIALIZED;

let mobile = false;
let pageStatus;

/*
 * Prototype functions.
 */

function _findElement(element, selector) {
	if (selector.includes("=")) {
		const key = selector.split("=")[0];
		const value = selector.split("=")[1];

		const result = [...document.querySelectorAll(key)]
			.filter(e => e.innerText === value);
		if (result.length) return result[0];

		try {
			this.querySelector(selector);
		} catch (err) {
			return undefined;
		}
	}
	return element.querySelector(selector);
}

Document.prototype.find = function (selector) {
	return _findElement(this, selector);
};
Element.prototype.find = function (selector) {
	return _findElement(this, selector);
};

function _findAllElements(element, selector) {
	return element.querySelectorAll(selector);
}

Document.prototype.findAll = function (selector) {
	return _findAllElements(this, selector);
};
Element.prototype.findAll = function (selector) {
	return _findAllElements(this, selector);
};

Document.prototype.new = function (options) {
	if (typeof options === "string") {
		return this.createElement(options);
	} else if (typeof options === "object") {
		let element = this.createElement(options.type);

		const { id, class: clazz, text, html, value, href, children, attributes } = options;

		if (id) element.id = id;
		if (clazz) element.setAttribute("class", clazz);
		if (text) element.innerText = text;
		if (html) element.innerHTML = html;
		if (value) element.value = value;
		if (href) element.href = href;
		if (children) children.forEach(child => element.appendChild(child));

		for (let attribute in attributes)
			element.setAttribute(attribute, attributes[attribute]);

		return element;
	}
};

String.prototype.replaceAll = function (text, replace) {
	let str = this.toString();

	if (typeof text === "string") {
		while (str.includes(text)) {
			str = str.replace(text, replace);
		}
	} else if (typeof text === "object") {
		if (Array.isArray(text)) {
			for (let t of text) {
				str = str.replaceAll(t, replace);
			}
		}
	}

	return str;
};

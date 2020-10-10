console.log("TT - Loading global functions.");

/*
 * Add prototype functions.
 */

function _find(element, selector) {
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

Document.prototype.find = function (selector) {
	return _find(this, selector);
};
Element.prototype.find = function (selector) {
	return _find(this, selector);
};

Document.prototype.findAll = function (selector) {
	return this.querySelectorAll(selector);
};
Element.prototype.findAll = function (selector) {
	return this.querySelectorAll(selector);
};

Document.prototype.setClass = function (className) {
	return this.setAttribute("class", className);
};
Element.prototype.setClass = function (className) {
	return this.setAttribute("class", className);
};

Document.prototype.newElement = function (options) {
	if (typeof options == "string") {
		return this.createElement(options);
	} else if (typeof options == "object") {
		let newElement = this.createElement(options.type);

		if (options.id) newElement.id = options.id;
		if (options.class) newElement.setAttribute("class", options.class);
		if (options.text) newElement.innerText = options.text;
		if (options.html) newElement.innerHTML = options.html;
		if (options.value) newElement.value = options.value;
		if (options.href) newElement.href = options.href;

		for (let child of options.children || []) newElement.appendChild(child);

		for (let attr in options.attributes) newElement.setAttribute(attr, options.attributes[attr]);

		for (let key in options.style) newElement.style[key] = options.style[key];

		return newElement;
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

/*
 * Load some functions.
 */

/*
 * Load some normal functions.
 */

function getSearchParameters() {
	return new URL(window.location).searchParams;
}

function rotateElement(element, degrees) {
	let startDegrees = element.style.transform ? parseInt(element.style.transform.replace("rotate(", "").replace("deg)", "")) : 0;

	startDegrees = startDegrees % 360;
	element.style.transform = `rotate(${startDegrees}deg)`;

	const totalDegrees = startDegrees + degrees;
	const step = 1000 / degrees;

	let rotater = setInterval(function () {
		const currentRotation = element.style.transform ? parseInt(element.style.transform.replace("rotate(", "").replace("deg)", "")) : 0;
		let newRotation = currentRotation + step;

		if (currentRotation < totalDegrees && newRotation > totalDegrees) {
			newRotation = totalDegrees;
			clearInterval(rotater);
		}

		element.style.transform = `rotate(${newRotation}deg)`;
	}, 1);
}

function requireCondition(condition, attributes = {}) {
	attributes = {
		delay: 10,
		maxCycles: -1,
		...attributes,
	};

	return new Promise((resolve, reject) => {
		if (checkCondition()) return;

		let counter = 0;
		let checker = setInterval(() => {
			if (checkCounter(counter++) || checkCondition()) return clearInterval(checker);
		}, attributes.delay);

		function checkCondition() {
			let response = condition();
			if (!response) return;

			if (typeof response === "boolean") {
				if (response) return resolve();
			} else if (typeof response === "object") {
				if (response.hasOwnProperty("success")) {
					if (response.success === true) resolve(response.value);
					else reject(response.value);
				} else {
					resolve(response);
				}
			}
		}

		function checkCounter(count) {
			if (attributes.maxCycles <= 0) return false;

			if (count > attributes.maxCycles) {
				reject("Maximum cycles reached.");
				return true;
			}
			return false;
		}
	});
}

function requireElement(selector, attributes) {
	attributes = {
		invert: false,
		parent: document,
		...attributes,
	};

	return requireCondition(
		() => (attributes.invert && !attributes.parent.find(selector)) || (!attributes.invert && attributes.parent.find(selector)),
		attributes
	);
}

function requireSidebar() {
	return requireElement("#sidebar");
}

function hasParent(element, attributes = {}) {
	if (!element.parentElement) return false;

	if (attributes.class && element.parentElement.classList.contains(attributes.class)) return true;
	if (attributes.id && element.parentElement.id === attributes.id) return true;

	return hasParent(element.parentElement, attributes);
}

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

Document.prototype.new = function (options) {
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

		for (let child of options.children || [])
			newElement.appendChild(child);

		for (let attr in options.attributes)
			newElement.setAttribute(attr, options.attributes[attr]);

		for (let key in options.style)
			newElement.style[key] = options.style[key];

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
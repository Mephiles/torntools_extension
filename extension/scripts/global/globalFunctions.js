console.log("TT2 - Loading global functions.");

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

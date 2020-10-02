console.log("TT2 - Loading global functions.");

Document.prototype.find = function (selector) {
	return _findElement(this, selector);
};
Element.prototype.find = function (selector) {
	return _findElement(this, selector);
};
Document.prototype.findAll = function (selector) {
	return _findAllElements(this, selector);
};
Element.prototype.findAll = function (selector) {
	return _findAllElements(this, selector);
};

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

function _findAllElements(element, selector) {
	return element.querySelectorAll(selector);
}
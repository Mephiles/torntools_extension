const doc = document;

const DATABASE_STATUSES = {
	NOT_INITIALIZED: 0,
	LOADING: 1,
	LOADED: 2,
	ENTRY: 3,
	FAILED: 99,
};

let database_status = DATABASE_STATUSES.NOT_INITIALIZED;

Document.prototype.find = function (type) {
	if (type.indexOf("=") > -1 && type.indexOf("[") === -1) {
		let key = type.split("=")[0];
		let value = type.split("=")[1];

		for (let element of document.querySelectorAll(key)) {
			if (element.innerText === value) {
				return element;
			}
		}

		try {
			this.querySelector(type);
		} catch (err) {
			return undefined;
		}
	}
	return this.querySelector(type);
};
Element.prototype.find = function (type) {
	if (type.indexOf("=") > -1 && type.indexOf("[") === -1) {
		let key = type.split("=")[0];
		let value = type.split("=")[1];

		for (let element of document.querySelectorAll(key)) {
			if (element.innerText === value) {
				return element;
			}
		}

		try {
			this.querySelector(type);
		} catch (err) {
			return undefined;
		}
	}
	return this.querySelector(type);
};

function getPageStatus() {
	return new Promise((resolve) => {
		let checker = setInterval(function () {
			let page_heading = doc.find("#skip-to-content, .title___2sbYr, .nonFullScreen .content-title h4");
			let message = doc.find("div[role='main'] > .info-msg-cont");

			// Page heading
			if (page_heading) {
				switch (page_heading.innerText) {
					case "Please Validate":
						resolve("captcha");
						return clearInterval(checker);
					case "Error":
						resolve("blocked");
						return clearInterval(checker);
				}
			}

			// Page info message
			if (message) {
				if (message.innerText.includes("a page which is blocked when")) {
					resolve("blocked");
					return clearInterval(checker);
				}
			}

			if (page_heading || message) {
				resolve("okay");
				return clearInterval(checker);
			}
		});
	});
}

const ttStorage = {
	get: function (key, callback) {
		new Promise((resolve) => {
			if (Array.isArray(key)) {
				let arr = [];
				chrome.storage.local.get(key, function (data) {
					for (let item of key) {
						arr.push(data[item]);
					}
					return resolve(arr);
				});
			} else if (key === null) {
				chrome.storage.local.get(null, function (data) {
					return resolve(data);
				});
			} else {
				chrome.storage.local.get([key], function (data) {
					return resolve(data[key]);
				});
			}
		}).then(function (data) {
			callback(data);
		});
	},
	set: function (object, callback) {
		chrome.storage.local.set(object, function () {
			callback ? callback() : null;
		});
	},
	change: function (keys_to_change, callback) {
		for (let top_level_key of Object.keys(keys_to_change)) {
			chrome.storage.local.get(top_level_key, function (data) {
				let database = data[top_level_key];
				database = recursive(database, keys_to_change[top_level_key]);

				function recursive(parent, keys_to_change) {
					for (let key in keys_to_change) {
						if (parent && key in parent && typeof keys_to_change[key] === "object" && !Array.isArray(keys_to_change[key])) {
							parent[key] = recursive(parent[key], keys_to_change[key]);
						} else if (parent) {
							parent[key] = keys_to_change[key];
						} else {
							parent = { [key]: keys_to_change[key] };
						}
					}
					return parent;
				}

				chrome.storage.local.set({ [top_level_key]: database }, function () {
					callback ? callback() : null;
				});
			});
		}
	},
	clear: function (callback) {
		chrome.storage.local.clear(function () {
			callback ? callback() : null;
		});
	},
	reset: function (callback) {
		chrome.storage.local.get(["api_key"], function (data) {
			let api_key = data.api_key;
			chrome.storage.local.clear(function () {
				chrome.storage.local.set(STORAGE, function () {
					chrome.storage.local.set(
						{
							api_key: api_key,
						},
						function () {
							chrome.storage.local.get(null, function (data) {
								console.log("Storage cleared");
								console.log("New storage", data);
								callback ? callback() : null;
							});
						}
					);
				});
			});
		});
	},
};

function getCurrentPage() {
	const pages = {
		index: "home",
		jailview: "jail",
		hospitalview: "hospital",
		item: "items",
		profiles: "profile",
		factions: "faction",
	};

	let page = window.location.pathname.substring(1);

	if (page.endsWith(".php")) page = page.substring(0, page.length - 4);
	else if (page.endsWith(".html")) page = page.substring(0, page.length - 5);

	return pages[page] || page;
}

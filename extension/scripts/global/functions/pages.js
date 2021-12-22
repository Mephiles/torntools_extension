"use strict";

function initializeInternalPage(options = {}) {
	options = {
		sortTables: false,
		...options,
	};

	// Check if the user is on mobile or tablet.
	checkDevice().then(({ mobile, tablet }) => {
		if (mobile) document.body.classList.add("tt-mobile");
		else document.body.classList.remove("tt-mobile");

		if (tablet) document.body.classList.add("tt-tablet");
		else document.body.classList.remove("tt-tablet");
	});

	// Add sorting functionality to tables.
	if (options.sortTables) {
		document.addEventListener("click", (event) => {
			if (event.target.tagName === "TH") {
				const clickedHeader = event.target;
				if (clickedHeader.getAttribute("class") && clickedHeader.getAttribute("class").split(" ").includes("no-sorting")) return;

				const table = findParent(clickedHeader, { tag: "TABLE" });
				if (!table || !table.classList.contains("sortable")) return;

				sortTable(table, [...table.findAll("th")].indexOf(clickedHeader) + 1);
			}
		});
	}
}

function loadConfirmationPopup(options = {}) {
	options = {
		title: "Title",
		message: "A message here.",
		execute: false,
		variables: {},
		...options,
	};

	return new Promise((resolve, reject) => {
		const popup = document.find("#tt-confirmation-popup");
		const message = popup.find(".message");

		document.find("#tt-black-overlay").classList.remove("tt-hidden");
		popup.classList.remove("tt-hidden");

		document.body.classList.add("tt-unscrollable");

		popup.find(".title").textContent = options.title;
		message.innerHTML = options.message;

		if (options.execute && typeof options.execute === "function") options.execute(message, options.variables);

		popup.find("#popupConfirm").addEventListener("click", () => {
			document.find("#tt-black-overlay").classList.add("tt-hidden");
			popup.classList.add("tt-hidden");

			document.body.classList.remove("tt-unscrollable");

			const data = {};
			for (const input of message.findAll("textarea, input")) {
				let type = "value";
				if (input.tagName === "INPUT") {
					if (input.type === "checkbox") type = "checked";
				}

				data[input.getAttribute("name")] = input[type];
			}

			resolve(data);
		});
		popup.find("#popupCancel").addEventListener("click", () => {
			document.find("#tt-black-overlay").classList.add("tt-hidden");
			popup.classList.add("tt-hidden");

			document.body.classList.remove("tt-unscrollable");

			reject();
		});
	});
}

function sendMessage(text, good, options = {}) {
	options = {
		reload: false,
		...options,
	};

	const message = document.find("#message");
	if (!message) return;

	message.classList.remove("tt-hidden");
	message.textContent = text;
	message.style.backgroundColor = good ? "#30e202" : "#ff19199e";
	message.style.maxHeight = message.scrollHeight + "px";

	if (options.reload) {
		setTimeout(() => {
			location.reload();
		}, 1200);
	} else {
		setTimeout(() => {
			message.textContent = "";
			message.classList.add("tt-hidden");
		}, 1500);
	}
}

function getPageTheme() {
	const theme = settings.themes.pages;

	// noinspection JSIncompatibleTypesComparison
	if (theme === "default") {
		if (window.matchMedia) return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
		return "light";
	}

	return theme;
}

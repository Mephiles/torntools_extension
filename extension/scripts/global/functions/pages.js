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
		...options,
	};

	return new Promise((resolve, reject) => {
		document.find("#tt-black-overlay").classList.remove("hidden");
		document.find("#tt-confirmation-popup").classList.remove("hidden");

		document.body.classList.add("tt-unscrollable");

		document.find("#tt-confirmation-popup .title").textContent = options.title;
		document.find("#tt-confirmation-popup .message").innerHTML = options.message;

		document.find("#tt-confirmation-popup #popupConfirm").onclick = () => {
			document.find("#tt-black-overlay").classList.add("hidden");
			document.find("#tt-confirmation-popup").classList.add("hidden");

			document.body.classList.remove("tt-unscrollable");

			const data = {};
			for (const input of document.findAll("#tt-confirmation-popup .message textarea")) {
				data[input.getAttribute("name")] = input.value;
			}

			resolve(data);
		};
		document.find("#tt-confirmation-popup #popupCancel").onclick = () => {
			document.find("#tt-black-overlay").classList.add("hidden");
			document.find("#tt-confirmation-popup").classList.add("hidden");

			document.body.classList.remove("tt-unscrollable");

			reject();
		};
	});
}

function sendMessage(text, good, options = {}) {
	options = {
		reload: false,
		...options,
	};

	const message = document.find("#message");
	if (!message) return;

	message.classList.remove("hidden");
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
			message.classList.add("hidden");
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

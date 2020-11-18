document.addEventListener("click", (event) => {
	if (event.target.tagName === "TH") {
		let clickedHeader = event.target;
		if (clickedHeader.getAttribute("class") && clickedHeader.getAttribute("class").split(" ").includes("no-sorting")) return;

		const table = findParent(clickedHeader, { tag: "TABLE" });
		if (!table || !table.classList.contains("sortable")) return;

		sortTable(table, [...table.findAll("th")].indexOf(clickedHeader) + 1);
	}
});

// mobile check
checkMobile().then((mobile) => {
	if (mobile) document.documentElement.classList.add("tt-mobile");
	else document.documentElement.classList.remove("tt-mobile");
});

function loadConfirmationPopup(options) {
	return new Promise((resolve, reject) => {
		document.find("#tt-black-overlay").classList.remove("hidden");
		document.find("#tt-confirmation-popup").classList.remove("hidden");

		document.find("body").classList.add("tt-unscrollable");

		document.find("#tt-confirmation-popup .title").innerText = options.title;
		document.find("#tt-confirmation-popup .message").innerHTML = options.message;

		document.find("#tt-confirmation-popup #popupConfirm").onclick = () => {
			document.find("#tt-black-overlay").classList.add("hidden");
			document.find("#tt-confirmation-popup").classList.add("hidden");

			document.find("body").classList.remove("tt-unscrollable");

			resolve();
		};
		document.find("#tt-confirmation-popup #popupCancel").onclick = () => {
			document.find("#tt-black-overlay").classList.add("hidden");
			document.find("#tt-confirmation-popup").classList.add("hidden");

			document.find("body").classList.remove("tt-unscrollable");

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
	message.innerText = text;
	message.style.backgroundColor = good ? "#30e202" : "#ff19199e";
	message.style.maxHeight = message.scrollHeight + "px";

	if (options.reload) {
		setTimeout(() => {
			location.reload();
		}, 1200);
	} else {
		setTimeout(() => {
			message.innerText = "";
			message.classList.add("hidden");
		}, 1500);
	}
}

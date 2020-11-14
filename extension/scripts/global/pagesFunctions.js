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

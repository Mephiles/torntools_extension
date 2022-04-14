"use strict";
(async () => {
	const year = new Date().getUTCFullYear();
	const now = Date.now();

	if (Date.UTC(year, 3, 5, 12) > now || Date.UTC(year, 3, 25, 12) < now) return;

	featureManager.registerFeature("Easter Eggs", "event", () => settings.pages.competitions.easterEggs, initialiseDetector, enableDetector, null, null, null);

	const EGG_SELECTOR = "img[src^='competition.php?c=EasterEggs'][src*='step=eggImage'][src*='access_token=']";

	function initialiseDetector() {
		const container = document.find("#mainContainer");

		if (container) {
			new MutationObserver((mutations, observer) => {
				for (const node of mutations.flatMap((mutation) => [...mutation.addedNodes])) {
					if (node.nodeType !== Node.ELEMENT_NODE || !node.find(EGG_SELECTOR)) continue;

					highlightEgg(node.find(EGG_SELECTOR));
					observer.disconnect();
					break;
				}
			}).observe(container, { childList: true });
		}
	}

	function enableDetector() {
		for (const egg of document.findAll(EGG_SELECTOR)) {
			highlightEgg(egg);
		}
	}

	function highlightEgg(egg) {
		// Make sure the egg has been loaded.
		if (!egg.complete) {
			egg.addEventListener("load", () => highlightEgg(egg));
			return;
		}

		const canvas = document.newElement({ type: "canvas", attributes: { width: egg.width, height: egg.height } });
		const context = canvas.getContext("2d");
		context.drawImage(egg, 0, 0);

		// Check if the egg
		if (!context.getImageData(0, 0, canvas.width, canvas.height).data.some((d) => d !== 0)) return;

		document.find(".tt-overlay").classList.remove("tt-hidden");

		const locationText = calculateLocation(egg);

		const popup = document.newElement({
			type: "div",
			id: "tt-easter-popup",
			class: "tt-overlay-item",
			events: { click: removePopup },
			children: [
				document.newElement({ type: "span", text: "Detected an easter egg!" }),
				document.newElement({ type: "span", text: `It's located near the ${locationText} of your screen.` }),
				document.newElement({ type: "button", class: "tt-button-link", text: "Close" }),
			],
		});

		document.body.appendChild(popup);

		window.addEventListener("beforeunload", (event) => {
			if (egg.isConnected) {
				event.preventDefault();
				event.returnValue = "Egg present.";
			}
		});

		function removePopup() {
			document.find(".tt-overlay").classList.add("tt-hidden");
			popup.remove();
		}
	}

	function calculateLocation(element) {
		const { left, top, width, height } = element.getBoundingClientRect();

		const centerX = left + width / 2;
		const centerY = top + height / 2;

		const innerHeight = window.innerHeight;
		const innerWidth = window.innerWidth;

		const relativeHeight = centerY / innerHeight;
		const relativeWidth = centerX / innerWidth;

		let verticalText, horizontalText;

		if (relativeWidth > 1 || relativeWidth < 0 || relativeHeight > 1 || relativeHeight < 0) return "offscreen";

		if (relativeHeight < 0.25) verticalText = "top";
		else if (relativeHeight > 0.75) verticalText = "bottom";
		else verticalText = "center";

		if (relativeWidth < 0.3) horizontalText = "left";
		else if (relativeWidth > 0.7) horizontalText = "right";
		else horizontalText = "center";

		let text;
		if (verticalText === horizontalText) text = verticalText;
		else text = `${verticalText} ${horizontalText}`;

		return text;
	}
})();

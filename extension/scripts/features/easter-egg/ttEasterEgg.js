"use strict";
(async () => {
	const year = new Date().getUTCFullYear();
	const now = Date.now();

	if (Date.UTC(year, 3, 5, 12) > now || Date.UTC(year, 3, 25, 12) < now) return;

	featureManager.registerFeature(
		"Easter Eggs",
		"event",
		() => settings.pages.competitions.easterEggs,
		initialiseDetector,
		enableDetector,
		null,
		null,
		null
	);

	/*
	Easter Egg HTML 2023:
	<div id="easter-egg-hunt-root">
		<div class="eggContainer___D1zXi">
			<button type="button" class="eggAnim___ktpqQ" style="top: 1021px; left: 106px;" i-data="i_278_1021_100_50">
				<img id="egg190002" src="/images/items/476/large.png" alt="White egg" class="egg___TaPK3">
				<div class="glow___RFqkj"></div>
				<div class="particles___Q5Jvq">
					<div class="rotate___OHCOt">
						<div class="angle___j_7IF">
							<div class="size___p75j3">
								<div class="position___Z2iK6">
									<div class="pulse___zzi26">
										<div class="particle___GbWL8"></div>
									</div>
								</div>
							</div>
						</div>
						<div class="angle___j_7IF">
							<div class="size___p75j3">
								<div class="position___Z2iK6">
									<div class="pulse___zzi26">
										<div class="particle___GbWL8"></div>
									</div>
								</div>
							</div>
						</div>
						<div class="angle___j_7IF">
							<div class="size___p75j3">
								<div class="position___Z2iK6">
									<div class="pulse___zzi26">
										<div class="particle___GbWL8"></div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</button>
		</div>
	</div>
	CSS Selector from DevTools:
	/html/body/div[6]/div/div[2]
	*/

	const EGG_SELECTOR = "#easter-egg-hunt-root [class*='eggContainer__']";

	function initialiseDetector() {
		const container = document.find("#mainContainer");

		if (container) {
			new MutationObserver((mutations, observer) => {
				for (const node of mutations.flatMap((mutation) => [...mutation.addedNodes])) {
					if (node.nodeType !== Node.ELEMENT_NODE) continue;

					if (node.matches(EGG_SELECTOR) || node.find(EGG_SELECTOR)) {
						highlightEgg(
							node.matches(EGG_SELECTOR)
								? node
								: node.find(EGG_SELECTOR)
						);
						observer.disconnect();
						break;
					}
				}
			}).observe(container, { childList: true });
		}
	}

	function enableDetector() {
		document.body.classList.add("tt-easter-highlight");

		for (const egg of document.findAll(EGG_SELECTOR)) {
			highlightEgg(egg);
		}
	}

	function highlightEgg(egg) {
		// Make sure the egg has been loaded.
		/*if (!egg.complete) {
			egg.addEventListener("load", () => highlightEgg(egg));
			return;
		}

		if (!isVisible(egg)) {
			console.log("TT detected an hidden egg", egg);
			egg.classList.add("hidden-egg");
			return;
		}*/

		alert("TornTools detected an easter egg on this page.");

		const locationText = calculateLocation(egg.find("button"));

		document.find(".tt-overlay").classList.remove("tt-hidden");
		document.find(".tt-overlay").style.zIndex = "999";

		const popup = document.newElement({
			type: "div",
			id: "tt-easter-popup",
			class: "tt-overlay-item",
			events: { click: removePopup },
			children: [
				document.newElement({ type: "div", text: "Detected an easter egg!" }),
				document.newElement({ type: "div", text: `It's located near the ${locationText} of your screen.` }),
				document.newElement({
					type: "div",
					text: "NOTE: Clicking on invisible eggs is a bad idea. It will decrease your spawn rates going forward. We try to detect and ignore them, occasionally one might still be highlighted.",
				}),
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
			document.find(".tt-overlay").style = "";
			popup.remove();
		}
	}

	function isVisible(egg) {
		const canvas = document.newElement({ type: "canvas", attributes: { width: egg.width, height: egg.height } });
		const context = canvas.getContext("2d");
		context.drawImage(egg, 0, 0);

		const { data } = context.getImageData(0, 0, canvas.width, canvas.height);

		// total pixels 	= 1520
		// 0				= 868
		// not 0			= 652

		// 0 means it's transparent, not having any other pixels means it's completely hidden
		return data.some((d) => d !== 0);
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

		if (relativeHeight < 0.25) verticalText = "top";
		else if (relativeHeight > 0.75) verticalText = "bottom";
		else verticalText = "center";

		if (relativeWidth < 0.3) horizontalText = "left";
		else if (relativeWidth > 0.7) horizontalText = "right";
		else horizontalText = "center";

		let text;
		if (verticalText === horizontalText) text = verticalText;
		else text = `${verticalText} ${horizontalText}`;

		if (relativeWidth > 1 || relativeWidth < 0 || relativeHeight > 1 || relativeHeight < 0) text += " (offscreen)";

		return text;
	}
})();

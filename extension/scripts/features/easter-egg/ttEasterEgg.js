"use strict";
(async () => {
	if (!isEventActive(TORN_EVENTS.EASTER_EGG_HUNT, true)) {
		return;
	}

	featureManager.registerFeature("Easter Eggs", "event", () => settings.pages.competitions.easterEggs, initialiseDetector, enableDetector, null, null, null);

	/*
	Easter Egg HTML 2024:
	<div id="easter-egg-hunt-root">
		<div class="eggContainer___D1zXi">
			<button type="button" class="eggAnim___ktpqQ" i-data="i_545_435_100_50" disabled="" style="top: 435px; left: 373px;">
				<img id="egg189995" src="/images/items/474/large.png" alt="Congratulations, you found a Red egg. It has been placed in your inventory" class="egg___TaPK3 clicked___jb4fC">
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
			<div role="alertdialog" aria-modal="true" class="eggPopup___ZQxkj">
				<div class="popupImages___aaoYY">
					<div class="eggWrap___cWIUg"></div>
					<div class="eggItem___W3cY_ Red___P6SG_"></div>
					<div class="texture___nwZr2"></div>
				</div>
				<div class="text___sA1gW">
					<div class="title___a5Ukd">Congratulations, you found a Red Egg!</div>
					It has been placed in your inventory
				</div>
				<button type="button" aria-label="Close" class="close-icon right c-pointer wai-btn closeIcon___VgHgo"></button>
			</div>
		</div>
	</div>
	*/

	const EGG_SELECTOR = "#easter-egg-hunt-root [class*='eggContainer__']";

	function initialiseDetector() {
		const container = document.find("#mainContainer");

		if (container) {
			new MutationObserver((mutations, observer) => {
				for (const node of mutations.flatMap((mutation) => [...mutation.addedNodes])) {
					if (node.nodeType !== Node.ELEMENT_NODE) continue;

					if (node.matches(EGG_SELECTOR) || node.find(EGG_SELECTOR)) {
						highlightEgg(node.matches(EGG_SELECTOR) ? node : node.find(EGG_SELECTOR));
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

	async function highlightEgg(egg) {
		if (settings.pages.competitions.easterEggsAlert) {
			alert("TornTools detected an easter egg on this page.");
		}

		const locationText = calculateLocation(await requireElement(EGG_SELECTOR + " img"));

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

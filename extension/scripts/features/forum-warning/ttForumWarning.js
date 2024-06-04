"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature("Forum Warning", "forums", true, initialise, showWarning, removeWarning, null, null);

	async function initialise() {
		// noinspection JSCheckFunctionSignatures
		new MutationObserver(() => {
			if (!feature.enabled()) return;

			showWarning();
		}).observe(await requireElement("#forums-page-wrap"), { childList: true });
	}

	function showWarning() {
		// Ignore when there is no correct element.
		if (!document.find(".forums-committee-wrap, .forums-create-new")) return;
		// Ignore when there already is a warning present.
		if (document.find("#ttBugWarning")) return;

		const hash = getHashParameters();

		const subforum = parseInt(hash.get("f"));
		// Only trigger on the B&I subforum.
		if (subforum !== 19) return;

		const page = hash.get("p");
		if (page !== "forums" && page !== "newthread") return;

		let parent, position;
		if (page === "forums") {
			parent = document.find("ul.title");
			position = "afterend";
		} else if (page === "newthread") {
			parent = document.find("#editor-wrapper");
			position = "beforebegin";

			parent.find("[class*='actionButtonsWrapper__'] button").addEventListener("click", handleDisabledPost, { capture: true, once: true });

			const input = parent.find(".editor-content.mce-content-body");
			const text = "I'm currently posting this with TornTools enabled.";
			if (!input.innerText.includes(text)) {
				input.innerHTML = text + "<br>" + input.innerHTML;
			}
		}

		parent.insertAdjacentElement(
			position,
			document.newElement({
				type: "div",
				id: "ttBugWarning",
				children: [
					document.newElement({ type: "span", text: "Please try disabling TornTools to make sure if the issue persists." }),
					document.newElement("br"),
					document.newElement({
						type: "span",
						class: "bug-help",
						text: "If the issues are caused by TornTools, contact the team: here.",
						events: { click: showPopup },
					}),
				],
			})
		);

		function showPopup() {
			const overlay = document.find(".tt-overlay");

			overlay.classList.remove("tt-hidden");
			overlay.addEventListener("click", closePopup);

			const popup = document.newElement({
				type: "div",
				id: "tt-help-popup",
				class: "tt-overlay-item",
				children: [
					document.newElement({ type: "span", text: "Support is provided in multiple ways!" }),
					document.newElement("br"),
					document.newElement("br"),
					document.newElement({
						type: "a",
						text: "- Join our Discord and report the issue there.",
						attributes: {
							href: "https://discord.com/invite/ukyK6f6",
							target: "_blank",
						},
					}),
					document.newElement("br"),
					document.newElement({
						type: "a",
						text: "- Post it in our forum thread.",
						attributes: {
							href: FORUM_POST,
							target: "_blank",
						},
					}),
					document.newElement("br"),
					document.newElement("br"),
					document.newElement({ type: "button", class: "tt-button-link", text: "Close", events: { click: closePopup } }),
				],
			});

			document.body.appendChild(popup);

			function closePopup() {
				overlay.removeEventListener("click", closePopup);
				overlay.classList.add("tt-hidden");

				popup.remove();
			}
		}
	}

	function handleDisabledPost(event) {
		event.preventDefault();
		event.stopPropagation();
		event.stopImmediatePropagation();

		const overlay = document.find(".tt-overlay");

		overlay.classList.remove("tt-hidden");
		overlay.addEventListener("click", closePopup);

		const popup = document.newElement({
			type: "div",
			id: "tt-help-popup",
			class: "tt-overlay-item",
			children: [
				document.newElement({
					type: "span",
					class: "warning-text",
					text: "Please make sure this issue is not caused by TornTools before posting in this forum.",
				}),
				document.newElement("br"),
				document.newElement("br"),
				document.newElement({ type: "span", text: "If you can not replicate it without TornTools enabled, please report it to us instead of Torn!" }),
				document.newElement("br"),
				document.newElement("br"),
				document.newElement({
					type: "a",
					text: "- Join our Discord and report the issue there.",
					attributes: {
						href: "https://discord.com/invite/ukyK6f6",
						target: "_blank",
					},
				}),
				document.newElement("br"),
				document.newElement({
					type: "a",
					text: "- Post it in our forum thread.",
					attributes: {
						href: FORUM_POST,
						target: "_blank",
					},
				}),
				document.newElement("br"),
				document.newElement("br"),
				document.newElement({ type: "button", class: "tt-button-link", text: "Close", events: { click: closePopup } }),
			],
		});

		document.find("#editor-form").appendChild(popup);

		function closePopup() {
			overlay.removeEventListener("click", closePopup);
			overlay.classList.add("tt-hidden");

			popup.remove();
			return true;
		}
	}

	function removeWarning() {
		document.find("#ttBugWarning")?.remove();

		const actions = document.find("#bbc-editor .actions");
		if (actions) {
			actions.find("button[type='submit']")?.removeEventListener("click", handleDisabledPost);
		}
	}
})();

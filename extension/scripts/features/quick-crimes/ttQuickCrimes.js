"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Quick Crimes",
		"crimes",
		() => settings.pages.crimes.quickCrimes,
		initialise,
		loadCrimes,
		dispose,
		{
			storage: ["settings.pages.crimes.quickCrimes"],
		},
		null
	);

	let movingElement, showCrimesAgainOnFirefoxObserver;

	function initialise() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.CRIMES_LOADED].push(() => {
			if (!feature.enabled()) return;

			loadCrimes();
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.CRIMES_CRIME].push(() => {
			if (!feature.enabled()) return;

			loadCrimes();
		});
	}

	async function loadCrimes() {
		await requireElement(".specials-cont-wrap form[name='crimes'], #defaultCountdown");

		const isTouchDevice = mobile || tablet;
		const { container, content, options } = createContainer("Quick Crimes", {
			previousElement: document.find(".content-title"),
			allowDragging: true,
			compact: true,
		});
		showCrimesAgainOnFirefox(container.id);

		content.appendChild(document.newElement({ type: "div", class: "inner-content" }));

		options.appendChild(
			document.newElement({
				type: "div",
				class: "option",
				id: "edit-items-button",
				children: [document.newElement({ type: "i", class: "fas fa-plus" }), "Edit"],
				events: {
					click: (event) => {
						event.stopPropagation();

						const enabled = options.find("#edit-items-button").classList.toggle("tt-overlay-item");

						for (const crime of content.findAll(".quick-item")) {
							const item = crime.find(".forced-item");
							if (enabled) {
								crime.classList.add("tt-overlay-item", "removable");
								item.classList.remove("item");
							} else {
								crime.classList.remove("tt-overlay-item", "removable");
								item.classList.add("item");
							}
						}

						if (enabled) {
							document.find(".tt-overlay").classList.remove("tt-hidden");

							const draggableCrimes = document.findAll(".specials-cont-wrap form[name='crimes'] .item[draggable='true']");
							if (draggableCrimes.length) {
								draggableCrimes[0].closest(".specials-cont-wrap form[name='crimes']").classList.add("tt-overlay-item");

								for (const crime of draggableCrimes) {
									crime.addEventListener("click", onCrimeClick);
									crime.setAttribute("draggable", "false");
								}
							}
						} else {
							document.find(".tt-overlay").classList.add("tt-hidden");

							const nonDraggableCrimes = document.findAll(".specials-cont-wrap form[name='crimes'] .item[draggable='false']");
							nonDraggableCrimes[0].closest(".specials-cont-wrap form[name='crimes']").classList.remove("tt-overlay-item");

							for (const crime of nonDraggableCrimes) {
								crime.removeEventListener("click", onCrimeClick);
								crime.setAttribute("draggable", "true");
							}
						}
					},
				},
			})
		);

		for (const quickCrime of quick.crimes) {
			addQuickCrime(quickCrime, false);
		}

		makeDraggable();

		function makeDraggable() {
			const form = document.find(".specials-cont-wrap form[name='crimes']");
			if (!form || !form.hasAttribute("action")) return;

			const action = `${location.origin}/${form.getAttribute("action")}`;
			const step = getSearchParameters(action).get("step");
			if (!["docrime2", "docrime4"].includes(step)) return;

			for (const crime of form.findAll("ul.item")) {
				if (crime.hasAttribute("draggable")) continue;

				crime.setAttribute("draggable", "true");
				if (!isTouchDevice) {
					crime.addEventListener("dragstart", onDragStart);
					crime.addEventListener("dragend", onDragEnd);
				}
			}
		}

		function onDragStart(event) {
			event.dataTransfer.setData("text/plain", null);

			setTimeout(() => {
				document.find("#quickCrimes > main").classList.add("drag-progress");
				if (document.find("#quickCrimes .temp.quick-item")) return;

				const form = document.find(".specials-cont-wrap form[name='crimes']");
				const nerve = parseInt(form.find("input[name='nervetake']").value);

				const action = `${location.origin}/${form.getAttribute("action")}`;
				const step = getSearchParameters(action).get("step");

				const data = {
					step,
					nerve,
					name: event.target.find(".choice-container input").value,
					icon: event.target.find(".title img").src,
					text: event.target.find(".bonus").textContent.trim(),
				};

				addQuickCrime(data, true);
			});
		}

		async function onDragEnd() {
			if (document.find("#quickCrimes .temp.quick-item")) {
				document.find("#quickCrimes .temp.quick-item").remove();
			}

			document.find("#quickCrimes > main").classList.remove("drag-progress");

			await saveCrimes();
		}

		function addQuickCrime(data, temporary) {
			const content = findContainer("Quick Crimes", { selector: ":scope > main" });
			const innerContent = content.find(".inner-content");

			const { step, nerve, name, icon, text } = data;

			if (innerContent.find(`.quick-item[data-id='${name}']`)) return;

			const closeIcon = document.newElement({
				type: "i",
				class: "fas fa-times tt-close-icon",
				attributes: { title: "Remove quick access. " },
				events: {
					click: async (event) => {
						event.stopPropagation();
						closeIcon.dispatchEvent(new Event("mouseout"));
						itemWrap.remove();
						await saveCrimes();
					},
				},
			});

			const itemWrap = document.newElement({
				type: "form",
				class: `quick-item ${temporary ? "temp" : ""}`,
				dataset: data,
				children: [
					document.newElement({ type: "input", attributes: { name: "nervetake", type: "hidden", value: nerve } }),
					document.newElement({ type: "input", attributes: { name: "crime", type: "hidden", value: name } }),
					document.newElement({
						type: "ul",
						class: "item forced-item",
						children: [
							document.newElement({ type: "div", class: "pic", attributes: { style: `background-image: url(${icon})` } }),
							document.newElement({ type: "div", class: "text", text: `${text} (-${nerve} nerve)` }),
						],
					}),
					closeIcon,
				],
				events: {
					async click() {
						if (itemWrap.classList.contains("removable")) {
							itemWrap.remove();
							await saveCrimes();
						}
					},
					dragstart(event) {
						event.dataTransfer.effectAllowed = "move";
						event.dataTransfer.setDragImage(event.currentTarget, 0, 0);

						movingElement = event.currentTarget;
					},
					async dragend() {
						movingElement.classList.remove("temp");
						movingElement = undefined;

						await saveCrimes();
					},
					dragover(event) {
						event.preventDefault();
					},
					dragenter(event) {
						if (movingElement !== event.currentTarget) {
							const children = [...innerContent.children];

							if (children.indexOf(movingElement) > children.indexOf(event.currentTarget))
								innerContent.insertBefore(movingElement, event.currentTarget);
							else if (event.currentTarget.nextElementSibling) {
								innerContent.insertBefore(movingElement, event.currentTarget.nextElementSibling);
							} else {
								innerContent.appendChild(movingElement);
							}
							movingElement.classList.add("temp");
						}
					},
				},
				attributes: {
					action: `crimes.php?step=${step}`,
					method: "post",
					name: "crimes",
					draggable: true,
				},
			});
			innerContent.appendChild(itemWrap);

			return itemWrap;
		}

		async function saveCrimes() {
			const content = findContainer("Quick Crimes", { selector: ":scope > main" });

			await ttStorage.change({
				quick: {
					crimes: [...content.findAll(".quick-item")].map((crime) => ({
						step: crime.dataset.step,
						nerve: parseInt(crime.dataset.nerve),
						name: crime.dataset.name,
						icon: crime.dataset.icon,
						text: crime.dataset.text,
					})),
				},
			});
		}

		async function onCrimeClick(event) {
			event.stopPropagation();
			event.preventDefault();

			const item = event.target.closest(".item");

			const form = document.find(".specials-cont-wrap form[name='crimes']");
			const nerve = parseInt(form.find("input[name='nervetake']").value);

			const action = `${location.origin}/${form.getAttribute("action")}`;
			const step = getSearchParameters(action).get("step");

			const data = {
				step,
				nerve,
				name: item.find(".choice-container input").value,
				icon: item.find(".title img").src,
				text: item.find(".bonus").textContent.trim(),
			};

			const quick = addQuickCrime(data, false);

			quick.classList.add("removable", "tt-overlay-item");
			quick.find(".item").classList.remove("item");

			await saveCrimes();
		}
	}

	function showCrimesAgainOnFirefox(containerId) {
		if (!usingFirefox()) return;

		if (showCrimesAgainOnFirefoxObserver) {
			showCrimesAgainOnFirefoxObserver.disconnect();
			showCrimesAgainOnFirefoxObserver = undefined;
			return;
		}

		showCrimesAgainOnFirefoxObserver = new MutationObserver((mutations, observer) => {
			const hasRemovedQuickCrimes = ![...mutations]
				.filter((mutation) => mutation.removedNodes.length)
				.flatMap((mutation) => [...mutation.removedNodes])
				.map((node) => node.id)
				.find((id) => id === containerId);
			if (hasRemovedQuickCrimes) return;

			loadCrimes();
		});
		showCrimesAgainOnFirefoxObserver.observe(document.find(".content-wrapper"), { childList: true, attributes: true, subtree: true });
	}

	function dispose() {
		removeContainer("Quick Crimes");
	}
})();

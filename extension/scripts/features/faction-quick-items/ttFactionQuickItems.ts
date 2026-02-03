(async () => {
	if (!isOwnFaction) return;

	let movingElement: Element | undefined;
	let isEditing = false;

	const feature = featureManager.registerFeature(
		"Faction Quick Items",
		"faction",
		() => settings.pages.faction.quickItems,
		addListener,
		null,
		() => removeContainer("Faction Quick Items"),
		{
			storage: ["settings.pages.faction.quickItems"],
		},
		null,
		{ liveReload: true }
	);

	function addListener() {
		document.addEventListener(
			"click",
			(event) => {
				if (isElement(event.target) && event.target.classList.contains("close-act")) {
					const responseWrap = findParent(event.target, { class: "response-wrap" });

					if (responseWrap) responseWrap.style.display = "none";
				}
			},
			{ passive: true }
		);
		setInterval(() => {
			for (const timer of document.findAll(".counter-wrap.tt-modified")) {
				let secondsLeft: number;
				if ("secondsLeft" in timer.dataset) secondsLeft = parseInt(timer.dataset.secondsLeft);
				else secondsLeft = parseInt(timer.dataset.time);
				secondsLeft--;
				if (secondsLeft < 0) secondsLeft = 0;

				timer.textContent = formatTime({ seconds: secondsLeft }, { type: "timer", daysToHours: true });

				timer.dataset.secondsLeft = `${secondsLeft}`;
			}
		}, 1000);

		CUSTOM_LISTENERS[EVENT_CHANNELS.FACTION_ARMORY_TAB].push(({ section }) => {
			if (!feature.enabled()) return;

			if (["medical", "drugs", "boosters", "points", "donate", "consumables", "loot", "utilities"].includes(section)) {
				showQuickItems(section);
				setupQuickDragListeners();
				setupOverlayItems(document);
				attachEditListeners(isEditing);
			} else hideQuickItems();
		});
	}

	async function showQuickItems(section: string) {
		if (!section) return;

		const presentFilter = findContainer("Faction Quick Items");
		if (presentFilter) {
			presentFilter.classList.remove("tt-hidden");
			return;
		}

		const { content, options } = createContainer("Faction Quick Items", {
			class: "mt10",
			nextElement: document.find("#faction-armoury > hr"),
			allowDragging: true,
			compact: true,
		});
		content.appendChild(elementBuilder({ type: "div", class: "inner-content" }));
		content.appendChild(elementBuilder({ type: "div", class: "response-wrap" }));
		options.appendChild(
			elementBuilder({
				type: "div",
				class: "option",
				id: "edit-items-button",
				children: [elementBuilder({ type: "i", class: "fa-solid fa-plus" }), "Edit"],
				events: {
					click: (event) => {
						event.stopPropagation();

						const enabled = options.find("#edit-items-button").classList.toggle("tt-overlay-item");
						isEditing = enabled;

						const content = findContainer("Faction Quick Items", { selector: ":scope > main" });
						for (const quick of content.findAll(".item")) {
							if (enabled) {
								quick.classList.add("tt-overlay-item");
								quick.classList.add("removable");
							} else {
								quick.classList.remove("tt-overlay-item");
								quick.classList.remove("removable");
							}
						}

						for (const category of document.findAll("#faction-armoury-tabs .torn-tabs > li")) {
							if (
								!["Medical", "Drugs", "Boosters", "Points", "Consumables", "Loot", "Utilities"].includes(
									category.find("a.ui-tabs-anchor").textContent.trim()
								)
							)
								continue;

							if (enabled) category.classList.add("tt-overlay-item");
							else category.classList.remove("tt-overlay-item");
						}
						for (const item of document.findAll("#armoury-medical, #armoury-drugs, #armoury-boosters, #armoury-points, #armoury-consumables")) {
							if (enabled) item.classList.add("tt-overlay-item-notbroken");
							else item.classList.remove("tt-overlay-item-notbroken");
						}

						if (enabled) document.find(".tt-overlay").classList.remove("tt-hidden");
						else document.find(".tt-overlay").classList.add("tt-hidden");

						attachEditListeners(enabled);
					},
				},
			})
		);

		for (const quickItem of quick.factionItems) {
			addQuickItem(quickItem, false);
		}

		requireItemsLoaded().then(setupQuickDragListeners);
	}

	function setupQuickDragListeners() {
		const enableDrag = !mobile && !tablet;
		const tab = document.find("#faction-armoury-tabs .armoury-tabs[aria-expanded='true']");

		if (tab.id === "armoury-points") {
			for (const item of tab.findAll(".give[data-role]")) {
				const type = item.textContent.trim().split(" ")[1].toLowerCase();

				item.dataset.type = "tt-points";
				if (enableDrag) {
					item.setAttribute("draggable", "true");
					item.addEventListener("dragstart", onDragStart);
					item.addEventListener("dragend", onDragEnd);
				}

				item.appendChild(
					elementBuilder({
						type: "div",
						class: "img-wrap tt-lazy-magic",
						dataset: { itemid: `points-${type}` },
						style: { display: "none" },
					})
				);
			}
		} else {
			for (const item of tab.findAll(".item-list > li")) {
				const imgWrap = item.find(".img-wrap");

				if (!allowQuickItem(parseInt(imgWrap.dataset.itemid), item.find(".type")?.textContent)) continue;

				if (enableDrag) {
					item.setAttribute("draggable", "true");
					item.addEventListener("dragstart", onDragStart);
					item.addEventListener("dragend", onDragEnd);
				}
			}
		}

		function onDragStart(event: DragEvent) {
			event.dataTransfer.setData("text/plain", null);

			setTimeout(() => {
				document.find("#factionQuickItems > main").classList.add("drag-progress");
				if (document.find("#factionQuickItems .temp.item")) return;

				const _id = (event.target as Element).find(".img-wrap").dataset.itemid;
				const id = isNaN(parseInt(_id)) ? _id : parseInt(_id);

				addQuickItem({ id }, true);
			}, 10);
		}

		async function onDragEnd() {
			if (document.find("#factionQuickItems .temp.item")) {
				document.find("#factionQuickItems .temp.item").remove();
			}

			document.find("#factionQuickItems > main").classList.remove("drag-progress");

			await saveQuickItems();
		}
	}

	function addQuickItem(data: { id: string | number }, temporary = false) {
		const content = findContainer("Faction Quick Items", { selector: ":scope > main" });
		const innerContent = content.find(".inner-content");
		const responseWrap = content.find(".response-wrap");

		const { id } = data;

		if (innerContent.find(`.item[data-id='${id}']`)) return innerContent.find(`.item[data-id='${id}']`);
		if (!allowQuickItem(id, typeof id === "number" ? getTornItemType(id) : null)) return null;

		const itemWrap = elementBuilder({
			type: "div",
			class: temporary ? "temp item" : "item",
			dataset: data,
			events: {
				click: async () => {
					if (itemWrap.classList.contains("removable")) {
						itemWrap.remove();
						itemWrap.dispatchEvent(new Event("mouseout"));
						closeIcon.dispatchEvent(new Event("mouseout"));
						await saveQuickItems();
						return;
					}

					if (
						settings.pages.items.energyWarning &&
						hasAPIData() &&
						typeof id === "number" &&
						["Drug", "Energy Drink"].includes(getTornItemType(id))
					) {
						const received = getItemEnergy(id);
						if (received) {
							const [current, max] = getUserEnergy();
							if (current > max && received + current > 1000) {
								if (!confirm("Are you sure to use this item ? It will get you to more than 1000E.")) return;
							}
						}
					}

					const body = new URLSearchParams();

					if (id === "points-energy" || id === "points-nerve") {
						body.set("step", "armouryRefillEnergy");
						if (id === "points-energy") body.set("step", "armouryRefillEnergy");
						else if (id === "points-nerve") body.set("step", "armouryRefillNerve");

						fetchData("torn_direct", { action: "factions.php", method: "POST", body }).then((result) => {
							responseWrap.style.display = "block";
							responseWrap.innerHTML = "";

							responseWrap.appendChild(
								elementBuilder({ type: "span", class: `t-${result.success ? "green" : "red"} bold`, html: result.message })
							);
							responseWrap.appendChild(
								elementBuilder({
									type: "div",
									style: { display: "block" },
									children: [elementBuilder({ type: "a", href: "#", class: "close-act t-blue bold c-pointer", text: "Okay" })],
								})
							);
						});
					} else {
						Object.entries({ step: "useItem", fac: "1", itemID: id }).forEach(([key, value]) => body.set(key, value.toString()));

						fetchData<TornInternalUseItem>("torn_direct", { action: "item.php", method: "POST", body }).then(async (result) => {
							if (typeof result !== "object") return;

							const links = [elementBuilder({ type: "a", href: "#", class: "close-act t-blue h", text: "Close" })];
							if ("links" in result) {
								for (const link of result.links) {
									links.push(
										elementBuilder({
											type: "a",
											class: `t-blue h m-left10 ${link.class}`,
											href: link.url,
											text: link.title,
											attributes: Object.fromEntries(
												link.attr
													.split(" ")
													.filter((x) => !!x)
													.map((x) => x.split("="))
											),
										})
									);
								}
							}

							responseWrap.style.display = "block";
							responseWrap.innerHTML = "";
							responseWrap.appendChild(
								elementBuilder({
									type: "div",
									class: "armoury-tabs",
									children: [
										elementBuilder({
											type: "ul",
											class: "item-list",
											children: [
												elementBuilder({
													type: "li",
													class: "item-use-act",
													children: [
														elementBuilder({
															type: "div",
															class: "name",
															children: [elementBuilder({ type: "span", class: "qty", text: "10000" })],
														}),
														elementBuilder({
															type: "div",
															class: "use-cont action-cont",
															children: [
																elementBuilder({
																	type: "div",
																	class: "use-wrap",
																	children: [
																		elementBuilder({
																			type: "form",
																			dataset: { action: "useItem" },
																			attributes: { method: "post" },
																			children: [
																				elementBuilder({ type: "p", html: result.text }),
																				elementBuilder({ type: "p", children: links }),
																				elementBuilder({ type: "div", class: "clear" }),
																			],
																		}),
																	],
																	style: { display: "block" },
																}),
															],
															dataset: { itemid: id },
														}),
														elementBuilder({ type: "div", class: "clear" }),
													],
												}),
											],
										}),
									],
								})
							);

							for (const count of responseWrap.findAll(".counter-wrap")) {
								count.classList.add("tt-modified");
								count.textContent = formatTime({ seconds: parseInt(count.dataset.time) }, { type: "timer", daysToHours: true });
							}
						});
					}
				},
				dragstart(event) {
					event.dataTransfer.effectAllowed = "move";
					event.dataTransfer.setDragImage(event.currentTarget as Element, 0, 0);

					movingElement = event.currentTarget as Element;
				},
				async dragend() {
					movingElement.classList.remove("temp");
					movingElement = undefined;

					await saveQuickItems();
				},
				dragover(event) {
					event.preventDefault();
				},
				dragenter(event) {
					if (movingElement !== event.currentTarget) {
						const children = [...innerContent.children];

						const currentTarget = event.currentTarget as Element;
						if (children.indexOf(movingElement) > children.indexOf(currentTarget)) innerContent.insertBefore(movingElement, currentTarget);
						else if (currentTarget.nextElementSibling) {
							innerContent.insertBefore(movingElement, currentTarget.nextElementSibling);
						} else {
							innerContent.appendChild(movingElement);
						}
						movingElement.classList.add("temp");
					}
				},
			},
			attributes: {
				draggable: true,
			},
		});
		switch (id) {
			case "points-energy":
				itemWrap.appendChild(
					elementBuilder({
						type: "div",
						class: "pic icon-refill",
						children: [elementBuilder({ type: "i", class: "currency-points" })],
					})
				);
				itemWrap.setAttribute("title", "Energy Refill");
				itemWrap.appendChild(elementBuilder({ type: "div", class: "text", text: "Energy Refill" }));
				break;
			case "points-nerve":
				itemWrap.appendChild(
					elementBuilder({
						type: "div",
						class: "pic icon-refill",
						children: [elementBuilder({ type: "i", class: "currency-points" })],
					})
				);
				itemWrap.setAttribute("title", "Nerve Refill");
				itemWrap.appendChild(elementBuilder({ type: "div", class: "text", text: "Nerve Refill" }));
				break;
			default:
				itemWrap.appendChild(
					elementBuilder({ type: "div", class: "pic", attributes: { style: `background-image: url(/images/items/${id}/medium.png)` } })
				);
				if (hasAPIData()) {
					itemWrap.setAttribute("title", torndata.items[id].name);
					itemWrap.appendChild(elementBuilder({ type: "div", class: "text", text: torndata.items[id].name }));
				} else if (id in TORN_ITEMS) {
					itemWrap.setAttribute("title", TORN_ITEMS[id].name);
					itemWrap.appendChild(elementBuilder({ type: "div", class: "text", text: TORN_ITEMS[id].name }));
				} else {
					itemWrap.appendChild(elementBuilder({ type: "div", class: "text", text: id }));
				}
				break;
		}

		const closeIcon = elementBuilder({
			type: "i",
			class: "fa-solid fa-xmark tt-close-icon",
			attributes: { title: "Remove quick access." },
			events: {
				click: async (event) => {
					event.stopPropagation();
					itemWrap.dispatchEvent(new Event("mouseout"));
					closeIcon.dispatchEvent(new Event("mouseout"));
					itemWrap.remove();

					await saveQuickItems();
				},
			},
		});
		itemWrap.appendChild(closeIcon);
		innerContent.appendChild(itemWrap);
		return itemWrap;
	}

	async function saveQuickItems() {
		const content = findContainer("Faction Quick Items", { selector: ":scope > main" });

		await ttStorage.change({
			quick: {
				factionItems: [...content.findAll(".item")]
					.map((x) => x.dataset.id)
					.map((x) => (isNaN(parseInt(x)) ? (x as QuickFactionItem["id"]) : parseInt(x)))
					.map((x) => ({ id: x })),
			},
		});
	}

	function allowQuickItem(id: number | string, category: string | null) {
		return ["Medical", "Drug", "Energy Drink", "Alcohol", "Candy", "Booster"].includes(category) || id === "points-energy" || id === "points-nerve";
	}

	function hideQuickItems() {
		findContainer("Faction Quick Items")?.classList?.add("tt-hidden");
	}

	function attachEditListeners(enabled: boolean) {
		if (enabled) {
			for (const item of document.findAll(".armoury-tabs .item-list > li")) {
				const imgWrap = item.find(".img-wrap");

				if (!allowQuickItem(imgWrap.dataset.itemid, item.find(".type")?.textContent)) continue;

				item.addEventListener("click", onItemClickQuickEdit);
			}
			for (const refill of document.findAll("#armoury-points .give[data-role='give'], #armoury-points .give[data-role='refill']")) {
				refill.addEventListener("click", onItemClickQuickEdit);
			}
		} else {
			for (const item of document.findAll(".armoury-tabs .item-list > li")) {
				const imgWrap = item.find(".img-wrap");

				if (!allowQuickItem(imgWrap.dataset.itemid, item.find(".type")?.textContent)) continue;

				item.removeEventListener("click", onItemClickQuickEdit);
			}
			for (const refill of document.findAll("#armoury-points .give[data-role='give'], #armoury-points .give[data-role='refill']")) {
				refill.removeEventListener("click", onItemClickQuickEdit);
			}
		}
	}

	async function onItemClickQuickEdit(event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();

		const _target = event.target as HTMLElement;
		const target = _target.dataset.type === "tt-points" ? _target : findParent(_target, { tag: "LI" });
		let _id = target.find(".img-wrap").dataset.itemid;
		const id = isNaN(parseInt(_id)) ? _id : parseInt(_id);

		const item = addQuickItem({ id }, false);
		if (item) item.classList.add("tt-overlay-item", "removable");

		await saveQuickItems();
	}

	function setupOverlayItems(tab: Document | Element) {
		for (const item of tab.findAll(".item-list > li")) {
			const imgWrap = item.find(".img-wrap");

			if (allowQuickItem(parseInt(imgWrap.dataset.itemid), item.find(".type")?.textContent)) continue;

			item.classList.add("tt-overlay-ignore");
		}
	}
})();

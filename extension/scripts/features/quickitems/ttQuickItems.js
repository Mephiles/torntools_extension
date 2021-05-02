"use strict";

(async () => {
	featureManager.registerFeature(
		"Quick Items",
		"items",
		() => settings.pages.items.quickItems,
		initialiseQuickItems,
		loadQuickItems,
		() => removeContainer("Quick Items"),
		{
			storage: ["settings.pages.items.quickItems"],
		},
		null
	);

	function initialiseQuickItems() {
		document.addEventListener("click", (event) => {
			if (event.target.classList.contains("close-act")) {
				const responseWrap = findParent(event.target, { class: "response-wrap" });

				if (responseWrap) responseWrap.style.display = "none";
			}
		});
		setInterval(() => {
			for (const timer of document.findAll(".counter-wrap.tt-modified")) {
				let secondsLeft;
				if ("secondsLeft" in timer.dataset) secondsLeft = parseInt(timer.dataset.secondsLeft);
				else secondsLeft = parseInt(timer.dataset.time);
				secondsLeft--;
				if (secondsLeft < 0) secondsLeft = 0;

				timer.innerText = formatTime({ seconds: secondsLeft }, { type: "timer", daysToHours: true });

				timer.dataset.secondsLeft = `${secondsLeft}`;
			}
		}, 1000);

		CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_AMOUNT].push(({ item, amount }) => {
			updateItemAmount(item, amount);
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_SWITCH_TAB].push(() => {
			setupQuickDragListeners();
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_ITEMS_LOADED].push(({ tab }) => {
			updateXIDs().catch(() => {});
			setupOverlayItems(tab);
		});
		CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_EQUIPPED].push(({ item, equip }) => {
			updateEquippedItem(item, equip);
		});
	}

	async function loadQuickItems() {
		await requireContent();

		const { content, options } = createContainer("Quick Items", {
			nextElement: document.find(".equipped-items-wrap"),
			spacer: true,
			allowDragging: true,
		});
		content.appendChild(document.newElement({ type: "div", class: "inner-content" }));
		content.appendChild(document.newElement({ type: "div", class: "response-wrap" }));
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

						const content = findContainer("Quick Items", { selector: ":scope > main" });
						for (const quick of content.findAll(".item")) {
							if (enabled) {
								quick.classList.add("tt-overlay-item");
								quick.classList.add("removable");
							} else {
								quick.classList.remove("tt-overlay-item");
								quick.classList.remove("removable");
							}
						}

						for (const category of document.findAll("#categoriesItem:not(.no-items)")) {
							if (!["Temporary", "Medical", "Drugs", "Energy Drink", "Alcohol", "Candy", "Booster", "Other"].includes(category.dataset.type))
								continue;

							if (enabled) category.classList.add("tt-overlay-item");
							else category.classList.remove("tt-overlay-item");
						}
						for (const item of document.findAll("ul.items-cont:not(.no-items)")) {
							if (enabled) item.classList.add("tt-overlay-item");
							else item.classList.remove("tt-overlay-item");
						}

						if (enabled) document.find(".tt-overlay").classList.remove("hidden");
						else document.find(".tt-overlay").classList.add("hidden");

						if (enabled) {
							for (const item of document.findAll("ul.items-cont[aria-expanded='true'] > li")) {
								if (!allowQuickItem(parseInt(item.dataset.item), item.dataset.category)) continue;

								item.addEventListener("click", onItemClickQuickEdit);
							}
						} else {
							for (const item of document.findAll("ul.items-cont[aria-expanded='true'] > li")) {
								if (!allowQuickItem(parseInt(item.dataset.item), item.dataset.category)) continue;

								item.removeEventListener("click", onItemClickQuickEdit);
							}
						}
					},
				},
			})
		);

		for (const quickItem of quick.items) {
			addQuickItem(quickItem, false);
		}

		requireItemsLoaded().then(() => {
			setupQuickDragListeners();
		});
	}

	function addQuickItem(data, temporary = false) {
		const content = findContainer("Quick Items", { selector: ":scope > main" });
		const innerContent = content.find(".inner-content");
		const responseWrap = content.find(".response-wrap");

		const { id, xid } = data;

		if (innerContent.find(`.item[data-id='${id}']`)) return;
		if (!allowQuickItem(id, torndata.items[id].type)) return;

		let equipPosition;
		if (isEquipable(id, torndata.items[id].type)) {
			equipPosition = getEquipPosition(id, torndata.items[id].type);
			data.equipPosition = equipPosition;
		}

		const itemWrap = document.newElement({
			type: "div",
			class: temporary ? "temp item" : "item",
			dataset: data,
			events: {
				click: async () => {
					if (itemWrap.classList.contains("removable")) {
						itemWrap.remove();
						await saveQuickItems();
						return;
					}

					const data = isEquipable(id, torndata.items[id].type)
						? { step: "actionForm", confirm: 1, action: "equip", id: xid }
						: { step: "useItem", id: id, itemID: id };

					getAction({
						type: "post",
						action: "item.php",
						data,
						success: (str) => {
							if (JSON.isValid(str)) {
								const response = JSON.parse(str);

								const links = ["<a href='#' class='close-act t-blue h'>Close</a>"];
								if (response.links) {
									for (const link of response.links) {
										links.push(`<a class="t-blue h m-left10 ${link.class}" href="${link.url}" ${link.attr}>${link.title}</a>`);
									}
								}

								responseWrap.style.display = "block";
								responseWrap.innerHTML = `
									<div class="action-wrap use-act use-action">
										<form data-action="useItem" method="post">
											<p>${response.text}</p>
											<p>${links.join("")}</p>
											<div class="clear"></div>
										</form>
									</div>
								`;

								for (const count of responseWrap.findAll(".counter-wrap")) {
									count.classList.add("tt-modified");
									count.innerText = formatTime({ seconds: parseInt(count.dataset.time) }, { type: "timer", daysToHours: true });
								}

								if (response.success) {
									if (response.items) {
										for (const item of response.items.itemAppear) {
											triggerCustomListener(EVENT_CHANNELS.ITEM_AMOUNT, {
												item: parseInt(item.ID),
												amount: parseInt(item.qty),
												reason: "usage",
											});
										}
										for (const item of response.items.itemDisappear) {
											triggerCustomListener(EVENT_CHANNELS.ITEM_AMOUNT, {
												item: parseInt(item.ID),
												amount: -parseInt(item.qty),
												reason: "usage",
											});
										}
									} else {
										triggerCustomListener(EVENT_CHANNELS.ITEM_AMOUNT, { item: id, amount: -1, reason: "usage" });
									}
								}
							} else {
								responseWrap.style.display = "block";
								responseWrap.innerHTML = str;

								[...innerContent.findAll(`.item.equipped[data-equip-position="${equipPosition}"]`)].forEach((x) =>
									x.classList.remove("equipped")
								);

								if (str.includes(" equipped ")) {
									[...innerContent.findAll(`.item.equipped[data-equip-position="${equipPosition}"]`)].forEach((x) =>
										x.classList.remove("equipped")
									);
									itemWrap.classList.add("equipped");
								} else if (str.includes(" unequipped "))
									[...innerContent.findAll(`.item.equipped[data-equip-position="${equipPosition}"]`)].forEach((x) =>
										x.classList.remove("equipped")
									);
							}
						},
					});
				},
			},
		});
		itemWrap.appendChild(
			document.newElement({ type: "div", class: "pic", attributes: { style: `background-image: url(/images/items/${id}/medium.png)` } })
		);
		if (hasAPIData()) {
			itemWrap.setAttribute("title", torndata.items[id].name);
			itemWrap.appendChild(document.newElement({ type: "div", class: "text", text: torndata.items[id].name }));

			if (settings.apiUsage.user.inventory) {
				const inventoryItem = findItemsInList(userdata.inventory, { ID: id }, { single: true });
				const amount = inventoryItem ? inventoryItem.quantity : 0;

				itemWrap.appendChild(document.newElement({ type: "div", class: "sub-text quantity", attributes: { quantity: amount }, text: amount + "x" }));

				if (inventoryItem.equipped) itemWrap.classList.add("equipped");
			}
		} else {
			itemWrap.appendChild(document.newElement({ type: "div", class: "text", text: id }));
		}
		itemWrap.appendChild(
			document.newElement({
				type: "i",
				class: "fas fa-times tt-close-icon",
				attributes: { title: "Remove quick access. " },
				events: {
					click: async (event) => {
						event.stopPropagation();
						itemWrap.remove();

						await saveQuickItems();
					},
				},
			})
		);
		innerContent.appendChild(itemWrap);
		return itemWrap;
	}

	async function onItemClickQuickEdit(event) {
		event.stopPropagation();
		event.preventDefault();

		const target = findParent(event.target, { hasAttribute: "data-item" });
		const id = parseInt(target.dataset.item);

		const data = { id };
		if (isEquipable(id, target.dataset.category)) {
			data.xid = parseInt(target.find(".actions[xid]").getAttribute("xid"));
		}

		const item = addQuickItem(data, false);
		item.classList.add("tt-overlay-item", "removable");

		await saveQuickItems();
	}

	async function saveQuickItems() {
		const content = findContainer("Quick Items", { selector: ":scope > main" });

		await ttStorage.change({
			quick: {
				items: [...content.findAll(".item")].map((x) => {
					const data = { id: parseInt(x.dataset.id) };
					if (x.dataset.xid) data.xid = x.dataset.xid;

					return data;
				}),
			},
		});
	}

	function setupQuickDragListeners() {
		for (const item of document.findAll(".items-cont[aria-expanded=true] > li[data-item]")) {
			if (!allowQuickItem(parseInt(item.dataset.item), item.dataset.category)) continue;

			const titleWrap = item.find(".title-wrap");
			if (titleWrap.hasAttribute("draggable")) continue;

			titleWrap.setAttribute("draggable", "true");
			titleWrap.addEventListener("dragstart", onDragStart);
			titleWrap.addEventListener("dragend", onDragEnd);
		}

		function onDragStart(event) {
			event.dataTransfer.setData("text/plain", null);

			setTimeout(() => {
				document.find("#quickItems > main").classList.add("drag-progress");
				if (document.find("#quickItems .temp.item")) return;

				const id = parseInt(event.target.parentElement.dataset.item);

				const data = { id };
				if (isEquipable(id, event.target.parentElement.dataset.category)) {
					data.xid = parseInt(event.target.parentElement.find(".actions[xid]").getAttribute("xid"));
				}

				addQuickItem(data, true);
			}, 10);
		}

		async function onDragEnd() {
			if (document.find("#quickItems .temp.item")) {
				document.find("#quickItems .temp.item").remove();
			}

			document.find("#quickItems > main").classList.remove("drag-progress");

			await saveQuickItems();
		}
	}

	function allowQuickItem(id, category) {
		return (
			["Medical", "Drug", "Energy Drink", "Alcohol", "Candy", "Booster"].includes(category) ||
			[
				// Temporary Items
				220,
				221,
				222,
				226,
				229,
				239,
				242,
				246,
				256,
				257,
				392,
				394,
				581,
				611,
				616,
				742,
				833,
				840,
				1042,
				// Others
				403,
			].includes(id)
		);
	}

	function isEquipable(id, category) {
		return ["Temporary"].includes(category);
	}

	function getEquipPosition(id, category) {
		// 4 = Body Armor
		// 6 = Helmet
		// 7 = Pants
		// 8 = Boots
		// 9 = Gloves
		// 10 = CLOTHING - Jacket
		switch (category) {
			case "Primary":
				return 1;
			case "Secondary":
				return 2;
			case "Melee":
				return 3;
			case "Temporary":
				return 5;
			case "Defensive":
				return -1; // CHECKME - Get right position;
			default:
				return false;
		}
	}

	function updateItemAmount(id, change) {
		const quickQuantity = findContainer("Quick Items", { selector: `.item[data-id="${id}"] .quantity` });
		if (quickQuantity) {
			let newQuantity = parseInt(quickQuantity.getAttribute("quantity")) + change;
			if (newQuantity < 0) newQuantity = 0;

			quickQuantity.innerText = newQuantity + "x";
			quickQuantity.setAttribute("quantity", newQuantity);
		}
	}

	async function updateXIDs() {
		const items = [...document.findAll("ul.items-cont > li .actions[xid]")].filter((x) => {
			const itemid = parseInt(x.getAttribute("itemid"));
			return quick.items.some((y) => y.id === itemid);
		});
		if (!items.length) return;

		const quickContainer = findContainer("Quick Items", { selector: "main" });
		items.forEach((x) => {
			try {
				const itemid = parseInt(x.getAttribute("itemid"));
				const xid = x.getAttribute("xid");

				quick.items.find((y) => y.id === itemid).xid = xid;
				quickContainer.find(`.item[data-id="${itemid}"]`).dataset.xid = xid;
			} catch (error) {
				console.error("Couldn't update item ids!", error);
			}
		});

		await ttStorage.change({ quick: { items: quick.items } });
	}

	function updateEquippedItem(id, isEquip) {
		const item = torndata.items[id];

		const equipPosition = getEquipPosition(item.id, item.type);
		[...document.findAll(`.item.equipped[data-equip-position="${equipPosition}"]`)].forEach((x) => x.classList.remove("equipped"));

		if (isEquip && document.find(`.item[data-id="${item.id}"]`)) document.find(`.item[data-id="${item.id}"]`).classList.add("equipped");
	}

	/*
	 * Torn Function
	 */
	function getAction(options = {}) {
		options = {
			success: () => {},
			action: location.pathname,
			type: "get",
			data: {},
			async: true,
			...options,
		};

		return jQuery.ajax({
			url: "https://www.torn.com/" + addRFC(options.action),
			type: options.type,
			data: options.data,
			async: options.async,
			success: (msg) => options.success(msg),
			error: (xhr, ajaxOptions, error) => {
				console.error("Error during action call.", error);
			},
		});
	}

	function setupOverlayItems(tab) {
		for (const item of tab.findAll("li[data-item][data-category]")) {
			if (allowQuickItem(parseInt(item.dataset.item), item.dataset.category)) continue;

			item.classList.add("tt-overlay-ignore");
		}
	}
})();
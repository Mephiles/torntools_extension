const USABLE_ITEM_TYPES = ["Medical", "Drug", "Energy Drink", "Alcohol", "Candy", "Booster"];

requireDatabase().then(() => {
	requireContent().then(() => {
		console.log("TT - Quick items");
		if (shouldDisable()) return;

		injectXHR();

		// Quick items
		let quick_container = content.newContainer("Quick items", {
			id: "ttQuick",
			dragzone: true,
			next_element: doc.find(".equipped-items-wrap"),
		}).find(".content");
		let inner_content = doc.new({ type: "div", class: "inner-content" });
		let response_wrap = doc.new({ type: "div", class: "response-wrap" });
		quick_container.appendChild(inner_content);
		quick_container.appendChild(response_wrap);

		document.addEventListener("click", event => {
			if (event.target.classList.contains("close-act") && hasParent(event.target, { id: "ttQuick" })) {
				doc.find("#ttQuick .response-wrap").style.display = "none";
			}
		});

		addButton();

		if (quick.items.length > 0) {
			for (let id of quick.items) {
				addQuickItem(quick_container, inner_content, response_wrap, id);
			}
		}

		enableInjectListener();

		if (settings.scripts.no_confirm.global && settings.scripts.no_confirm.item_equip) {
			addItemListener();
		}
	});
});

requireDatabase().then(() => {
	itemsLoaded().then(() => {
		console.log("TT - Item values");

		initializeItems();

		// Drug detailed effects
		if (settings.pages.items.drug_details) {
			let item_info_container_mutation = new MutationObserver(mutations => {
				for (let mutation of mutations) {
					if (mutation.type === "childList") {
						if (mutation.addedNodes[0] && mutation.addedNodes[0].classList && mutation.addedNodes[0].classList.contains("show-item-info")) {
							let el = mutation.addedNodes[0];
							itemInfoLoaded(el).then(() => {
								let item_name = el.find("span.bold").innerText;
								if (item_name.indexOf("The") > -1) item_name = item_name.split("The ")[1];

								let drug_details = DRUG_INFORMATION[item_name.toLowerCase().replace(/ /g, "_")];
								if (drug_details === undefined) {
									return;
								}

								// Remove current info
								for (let eff of el.findAll(".item-effect")) {
									eff.remove();
								}

								// Pros
								if (drug_details.pros) {
									el.find(".info-msg").appendChild(doc.new({
										type: "div",
										class: "t-green bold item-effect m-top10",
										text: "Pros:",
									}));

									for (let eff of drug_details.pros) {
										el.find(".info-msg").appendChild(doc.new({
											type: "div",
											class: "t-green bold item-effect tabbed",
											text: eff,
										}));
									}
								}

								// Cons
								if (drug_details.cons) {
									el.find(".info-msg").appendChild(doc.new({
										type: "div",
										class: "t-red bold item-effect",
										text: "Cons:",
									}));

									for (let eff of drug_details.cons) {
										el.find(".info-msg").appendChild(doc.new({
											type: "div",
											class: "t-red bold item-effect tabbed",
											text: eff,
										}));
									}
								}

								// Cooldown
								if (drug_details.cooldown) {
									el.find(".info-msg").appendChild(doc.new({
										type: "div",
										class: "t-red bold item-effect",
										text: `Cooldown: ${drug_details.cooldown}`,
									}));
								}

								// Overdose
								if (drug_details.overdose) {
									el.find(".info-msg").appendChild(doc.new({
										type: "div",
										class: "t-red bold item-effect",
										text: "Overdose:",
									}));

									// bars
									if (drug_details.overdose.bars) {
										el.find(".info-msg").appendChild(doc.new({
											type: "div",
											class: "t-red bold item-effect tabbed",
											text: "Bars",
										}));

										for (let bar_eff of drug_details.overdose.bars) {
											el.find(".info-msg").appendChild(doc.new({
												type: "div",
												class: "t-red bold item-effect double-tabbed",
												text: bar_eff,
											}));
										}
									}

									// hospital time
									if (drug_details.overdose.hosp_time) {
										el.find(".info-msg").appendChild(doc.new({
											type: "div",
											class: "t-red bold item-effect tabbed",
											text: `Hospital: ${drug_details.overdose.hosp_time}`,
										}));
									}

									// extra
									if (drug_details.overdose.extra) {
										el.find(".info-msg").appendChild(doc.new({
											type: "div",
											class: "t-red bold item-effect tabbed",
											text: `Extra: ${drug_details.overdose.extra}`,
										}));
									}
								}
							});
						}
					}
				}
			});
			item_info_container_mutation.observe(doc.find("body"), { childList: true, subtree: true });
		}

		// Change item type page
		let sorting_icons = doc.findAll("ul[role=tablist] li:not(.no-items):not(.m-show):not(.hide)");
		for (let icon of sorting_icons) {
			icon.addEventListener("click", () => itemsLoaded().then(initializeItems));
		}
	});
});

function initializeItems() {
	console.log("Showing item information.");

	// Item values
	if (settings.pages.items.values) {
		displayItemPrices(itemlist.items);
	}

	if (!shouldDisable()) {
		// Quick items
		for (let item of doc.findAll(".items-cont[aria-expanded=true] > li[data-item]")) {
			if (!USABLE_ITEM_TYPES.includes(item.getAttribute("data-category"))) continue;

			const titleWrap = item.find(".title-wrap");

			titleWrap.setAttribute("draggable", "true");
			titleWrap.addEventListener("dragstart", onDragStart);
			titleWrap.addEventListener("dragend", onDragEnd);
		}
	}

	// Item Market links
	if (settings.pages.items.itemmarket_links && !mobile) {
		addItemMarketLinks();
	}

	if (settings.pages.items.highlight_bloodbags !== "none") highlightBloodBags();
}

function itemsLoaded() {
	return requireElement(".items-cont[aria-expanded=true] > li > .title-wrap");
}

function displayItemPrices(itemlist) {
	const list = doc.find(".items-cont[aria-expanded=true]");
	let items = list.findAll(":scope > li[data-item]");

	let total = 0;
	for (let item of items) {
		let id = item.getAttribute("data-item");
		let price = itemlist[id].market_value;
		let total_price;

		let parent = mobile ? item.find(".name-wrap") : (item.find(".bonuses-wrap") || item.find(".name-wrap"));
		let new_element;

		const quantity = parseInt(item.find(".item-amount.qty").innerText) || 1;
		total_price = quantity * parseInt(price);
		if (total_price) total += total_price;
		else if (total_price !== 0) total += price;

		if (parent.find(".tt-item-price"))
			continue;

		if (item.find(".bonuses-wrap")) {
			new_element = doc.new({ type: "li", class: "bonus left tt-item-price" });
		} else {
			new_element = doc.new({ type: "span", class: "tt-item-price" });

			if (item.find("button.group-arrow")) {
				new_element.style.paddingRight = "30px";
			}
		}
		if (mobile) {
			new_element.setAttribute("style", `position: absolute; right: -10px; top: 10px; float: unset !important; font-size: 11px;`);
			parent.find(".name").setAttribute("style", "position: relative; top: -3px;");
			parent.find(".qty").setAttribute("style", "position: relative; top: -3px;");
		}

		if (total_price) {
			if (quantity === 1) {
				new_element.appendChild(doc.new({ type: "span", text: `$${numberWithCommas(price, false)}` }));
			} else {
				new_element.appendChild(doc.new({ type: "span", text: `$${numberWithCommas(price, false)} |` }));
				new_element.appendChild(doc.new({ type: "span", text: ` ${quantity}x = `, class: "tt-item-quantity" }));
				new_element.appendChild(doc.new({ type: "span", text: `$${numberWithCommas(total_price, false)}` }));
			}
		} else if (price === 0) {
			new_element.innerText = `N/A`;
		} else {
			new_element.innerText = `$${numberWithCommas(price, false)}`;
		}

		parent.appendChild(new_element);
	}

	if (list.find(":scope > li > .tt-item-price")) list.find(":scope > li > .tt-item-price").parentElement.remove();

	list.insertBefore(doc.new({
		type: "li",
		class: "tt-ignore",
		children: [doc.new({
			type: "li",
			text: `Total Value: $${FORMATTER_NO_DECIMALS.format(total)}`,
			class: "tt-item-price",
		})],
	}), list.firstElementChild);
}

function useContainerLoaded() {
	return requireElement("#ttQuick .action-wrap.use-act.use-action");
}

function itemInfoLoaded(element) {
	return new Promise(resolve => {
		let checker = setInterval(() => {
			if (!element.find(".ajax-placeholder")) {
				resolve(true);
				return clearInterval(checker);
			}
		}, 100);
	});
}

function addButton() {
	let wrap = doc.new({ type: "div", class: "tt-option", id: "add-crime-button" });
	let icon = doc.new({ type: "i", class: "fas fa-plus" });
	wrap.appendChild(icon);
	wrap.innerHTML += " Add";

	doc.find("#ttQuick .tt-title .tt-options").appendChild(wrap);

	wrap.onclick = event => {
		event.stopPropagation();

		if (doc.find(".tt-black-overlay").classList.contains("active")) {
			doc.find(".tt-black-overlay").classList.remove("active");
			doc.find("ul.items-cont[aria-expanded='true']").classList.remove("tt-highlight-sector");
			doc.find(".tt-title .tt-options .tt-option#add-crime-button").classList.remove("tt-highlight-sector");

			for (let item of doc.findAll("ul.items-cont[aria-expanded='true']>li")) {
				if (!USABLE_ITEM_TYPES.includes(item.getAttribute("data-category"))) continue;

				item.onclick = undefined;
			}
		} else {
			doc.find(".tt-black-overlay").classList.add("active");
			doc.find("ul.items-cont[aria-expanded='true']").classList.add("tt-highlight-sector");
			doc.find(".tt-title .tt-options .tt-option#add-crime-button").classList.add("tt-highlight-sector");

			for (let item of doc.findAll("ul.items-cont[aria-expanded='true']>li")) {
				if (!USABLE_ITEM_TYPES.includes(item.getAttribute("data-category"))) continue;

				item.onclick = event => {
					event.stopPropagation();
					event.preventDefault();

					let target = findParent(event.target, { has_attribute: "data-item" });
					let id = target.getAttribute("data-item");

					addQuickItem(undefined, undefined, undefined, id);

					// Save
					let items = [...doc.findAll("#ttQuick .item")].map(x => x.getAttribute("item-id"));
					ttStorage.change({ quick: { items } });
				};
			}
		}
	};
}

function addItemMarketLinks() {
	for (let item of doc.findAll(".items-cont[aria-expanded=true] > li:not(.tt-ignore)")) {
		if (item.find(".tt-market-link, .tt-item-price, :scope > .ajax-placeholder")) continue;

		let li = doc.new({
			type: "li",
			class: "left tt-market-link",
			attributes: { "data-id": item.getAttribute("data-item") },
		});
		let a = doc.new({
			type: "a",
			href: `https://www.torn.com/imarket.php#/p=shop&step=shop&type=&searchname=${item.find(".image-wrap img").getAttribute("alt")}`,
		});
		a.appendChild(doc.new({ type: "i", class: "cql-item-market", attributes: { title: "Open Item Market" } }));
		li.appendChild(a);

		if (item.classList.contains("item-group")) item.classList.add("tt-modified");

		item.find(".name-wrap").classList.add("tt-modified");
		item.find(".cont-wrap").classList.add("tt-modified");

		let actionParent = doc.new({ type: "div" });

		let actionRight = item.find(".actions.right");
		actionRight.classList.add("tt-modified");

		actionParent.appendChild(actionRight);

		item.find(".cont-wrap").appendChild(actionParent);

		if (item.find("ul.actions-wrap .dump")) {
			item.find("ul.actions-wrap").insertBefore(li, item.find("ul.actions-wrap .dump"));
		} else {
			item.find("ul.actions-wrap").insertBefore(li, item.find("ul.actions-wrap .clear"));
		}
	}
}

const ALLOWED_BLOOD = {
	"o+": [738, 739], // 738
	"o-": [739], // 739
	"a+": [732, 733, 738, 739], // 732
	"a-": [733, 739], // 733
	"b+": [734, 735, 738, 739], // 734
	"b-": [735, 739], // 735
	"ab+": [732, 733, 734, 735, 736, 737, 738, 739], // 736
	"ab-": [733, 735, 737, 739], // 737
};

function highlightBloodBags() {
	const allowedBlood = ALLOWED_BLOOD[settings.pages.items.highlight_bloodbags];
	const items = doc.findAll("ul.items-cont[aria-expanded=true] > li[data-category='Medical']");

	for (let item of items) {
		if (!item.find(".name-wrap") || item.find(".name-wrap").classList.contains("tt-good_blood") || item.find(".name-wrap").classList.contains("tt-bad_blood")) continue;

		if (!item.getAttribute("data-sort").includes("Blood Bag : ")) continue; // is not a filled blood bag
		if (item.getAttribute("data-item") === "1012") continue; // is an irradiated blood bag

		const classes = item.find(".name-wrap").classList;

		if (allowedBlood.includes(parseInt(item.getAttribute("data-item")))) classes.add("tt-good_blood");
		else classes.add("tt-bad_blood");
	}
}

// Torn functions
function getAction(obj) {
	obj.success = obj.success || (() => {
	});
	obj.before = obj.before || (() => {
	});
	obj.complete = obj.complete || (() => {
	});
	const url = obj.action || window.location.protocol + "//" + window.location.hostname + location.pathname;
	const options = {
		url: "https://www.torn.com/" + addRFC(url),
		type: obj.type || "get",
		data: obj.data || {},
		async: typeof obj.async !== "undefined" ? obj.async : true,
		success: msg => {
			console.log("success");
			obj.success(msg);
		},
		error: (xhr, ajaxOptions, thrownError) => {
			console.log("error", thrownError);
		},
	};
	if (options.data.step !== undefined) {
	}
	if (obj.file) {
		options.cache = false;
		options.contentType = false;
		options.processData = false;
	}
	return $.ajax(options);
}

// Dragging
function onDragStart(event) {
	event.dataTransfer.setData("text/plain", null);

	setTimeout(() => {
		doc.find("#ttQuick .content").classList.add("drag-progress");
		if (doc.find("#ttQuick .temp.item")) return;

		let id = event.target.parentElement.getAttribute("data-item");

		addQuickItem(undefined, undefined, undefined, id, true);
		enableInjectListener();
	}, 10);
}

function onDragEnd() {
	if (doc.find("#ttQuick .temp.item")) {
		doc.find("#ttQuick .temp.item").remove();
	}

	doc.find("#ttQuick .content").classList.remove("drag-progress");

	let items = [...doc.findAll("#ttQuick .item")].map(x => x.getAttribute("item-id"));
	ttStorage.change({ quick: { items } });
}

function addQuickItem(container, innerContent, responseWrap, id, temporary = false) {
	if (!container) container = doc.find("#ttQuick");
	if (!innerContent) innerContent = doc.find("#ttQuick .inner-content");
	if (!responseWrap) responseWrap = doc.find("#ttQuick .response-wrap");

	if (innerContent.find(`.item[item-id='${id}']`)) return;
	if (!USABLE_ITEM_TYPES.includes(itemlist.items[id].type)) return;

	let amount = findItemsInList(userdata.inventory, { ID: id })[0];
	amount = amount ? amount.quantity : 0;

	let div = doc.new({ type: "div", class: temporary ? "temp item" : "item", attributes: { "item-id": id } });
	let pic = doc.new({
		type: "div",
		class: "pic",
		attributes: { style: `background-image: url(/images/items/${id}/medium.png)` },
	});
	let text = doc.new({ type: "div", class: "text", text: itemlist.items[id].name });
	let quantity = doc.new({
		type: "div",
		class: "sub-text tt-quickitems-quantity",
		attributes: { quantity: amount },
		text: amount + "x",
	});
	let closeIcon = doc.new({ type: "i", class: "fas fa-times tt-close-icon" });

	div.appendChild(pic);
	div.appendChild(text);
	div.appendChild(quantity);
	div.appendChild(closeIcon);
	innerContent.appendChild(div);

	closeIcon.addEventListener("click", event => {
		event.stopPropagation();
		div.remove();

		let items = [...doc.findAll("#ttQuick .item")].map(x => x.getAttribute("item-id"));
		ttStorage.change({ quick: { items: items } });
	});

	div.addEventListener("click", () => {
		console.log("Clicked Quick item");
		getAction({
			type: "post",
			action: "item.php",
			data: { step: "actionForm", id: id, action: "use" },
			success: str => {
				if (container.find(".action-wrap")) {
					container.find(".action-wrap").remove();
				}

				responseWrap.style.display = "block";
				responseWrap.innerHTML = str;

				useContainerLoaded().then(() => {
					container.find(`a[data-item='${id}']`).click();

					// adjust container
					container.find(".tt-content").style.maxHeight = container.find(".tt-content").scrollHeight + "px";
				});
			},
		});
	});
}

let injectListener = false;
let pendingActions = {};

function enableInjectListener() {
	if (injectListener) return;

	addXHRListener((event) => {
		const { page, json, xhr } = event.detail;

		if (page === "item" && json) {
			const params = new URLSearchParams(xhr.requestBody);
			const step = params.get("step");

			if (step === "useItem") {
				if (!json.success) return;

				if (params.get("step") !== "useItem") return;
				if (params.has("fac") && params.get("fac") !== "0") return;

				const item = params.get("itemID");

				updateItemAmount(item, -1);
			} else if (step === "sendItemAction") {
				if (!json.success) return;

				const actionId = json.confirm ? json.itemID : params.get("XID");
				const item = json.confirm ? params.get("itemID") : pendingActions[actionId].item;
				const amount = json.amount;

				if (json.confirm) pendingActions[actionId] = { item };
				else {
					delete pendingActions[actionId];

					updateItemAmount(item, -amount);
				}
			} else if (step === "getCategoryList" || step === "getNotAllItemsListWithoutGroups") {
				if (!settings.pages.items.values && !settings.pages.items.itemmarket_links) return;

				const currentTab = doc.find("ul.items-cont.tab-menu-cont[style=\"display: block;\"]") || doc.find("ul.items-cont.tab-menu-cont:not([style])");
				if (!currentTab) return;

				new MutationObserver((mutations, observer) => {
					if (doc.find("li.ajax-item-loader")) return;

					if (settings.pages.items.values) displayItemPrices(itemlist.items);
					if (settings.pages.items.itemmarket_links) addItemMarketLinks();
					if (settings.pages.items.highlight_bloodbags !== "none") highlightBloodBags();

					observer.disconnect();
				}).observe(currentTab, { subtree: true, childList: true });
			}
		}
	});

	injectListener = true;
}

function updateItemAmount(id, change) {
	const quickQuantity = doc.find(`#ttQuick .inner-content .item[item-id="${id}"] .tt-quickitems-quantity`);
	if (quickQuantity) {
		let newQuantity = parseInt(quickQuantity.getAttribute("quantity")) + change;

		quickQuantity.innerText = newQuantity + "x";
		quickQuantity.setAttribute("quantity", newQuantity);
	}

	for (let item of doc.findAll(`.items-cont > li[data-item="${id}"]`)) {
		const ttItemPrice = item.find(".tt-item-price");

		const ttItemQuantity = ttItemPrice.find(".tt-item-quantity");

		let price = itemlist.items[id].market_value;
		let newQuantity = parseInt(ttItemQuantity.innerText.match(/([0-9]*)x = /i)[1]) + change;

		ttItemQuantity.innerText = ` ${newQuantity}x = `;

		ttItemPrice.find("span:last-child").innerText = `$${numberWithCommas(price * newQuantity, false)}`;
	}
}

function addItemListener() {
	const script = doc.new({ type: "script", attributes: { type: "text/javascript" } });

	const sendListener = `
		(xhr, body) => {
			if (!body || !body.includes("step=actionForm")) return body;
		
			const params = getParams(body);
			${settings.scripts.no_confirm.item_equip ? `
				if (params.action === "equip" && confirm !== 1) {
					return paramsToBody({
						step: params.step,
						confirm: 1,
						action: params.action,
						id: params.id,
					});
				}
			` : ""}
	
			return body;
		}
	`;

	script.innerHTML = `
		(() => { 
			if (typeof xhrSendAdjustments === "undefined") xhrSendAdjustments = {};
			
			xhrSendAdjustments.noconfirm_items = ${sendListener}
		})();
	`;

	doc.find("head").appendChild(script);
}
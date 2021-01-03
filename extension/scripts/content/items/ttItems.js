"use strict";

let pendingActions = {};

(async () => {
	await loadDatabase();
	console.log("TT: Items - Loading script. ");

	storageListeners.settings.push(loadItems);
	loadItems();

	loadItemsOnce();

	console.log("TT: Items - Script loaded.");
})();

function loadItems() {
	requireContent().then(() => {
		loadQuickItems().catch((error) => console.error("Couldn't load the quick items.", error));
		showItemValues().catch((error) => console.error("Couldn't show the item values.", error));
		showDrugDetails().catch((error) => console.error("Couldn't show drug details.", error));
		showItemMarketIcons().catch((error) => console.error("Couldn't show the market icons.", error));
		highlightBloodBags().catch((error) => console.error("Couldn't highlight the correct blood bags.", error));
	});
	requireItemsLoaded().then(() => {
		initializeItems();
	});
}

function loadItemsOnce() {
	document.addEventListener("click", (event) => {
		if (event.target.classList.contains("close-act")) {
			const responseWrap = findParent(event.target, { class: "response-wrap" });

			if (responseWrap) responseWrap.style.display = "none";
		}
	});
	setInterval(() => {
		for (let timer of document.findAll(".counter-wrap.tt-modified")) {
			let secondsLeft;
			if ("secondsLeft" in timer.dataset) secondsLeft = parseInt(timer.dataset.secondsLeft);
			else secondsLeft = parseInt(timer.dataset.time);
			secondsLeft--;

			timer.innerText = formatTime({ seconds: secondsLeft }, { type: "timer" });

			timer.dataset.secondsLeft = `${secondsLeft}`;
		}
	}, 1000);

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
			}
			// TODO - Update item list features.
		}
	});

	requireItemsLoaded().then(() => {
		for (let icon of document.findAll("ul[role=tablist] li:not(.no-items):not(.m-show):not(.hide)")) {
			icon.addEventListener("click", () => requireItemsLoaded().then(initializeItems));
		}
	});
}

function requireItemsLoaded() {
	return requireElement(".items-cont[aria-expanded=true] > li > .title-wrap");
}

function initializeItems() {
	setupQuickDragListeners().catch((error) => console.error("Couldn't make the items draggable for quick items.", error));
}

const quickItems = {
	updateQuantity(id, change) {
		const quickQuantity = findContainer("Quick Items", { selector: `.item[item-id="${id}"] .quantity` });
		if (!quickQuantity) return;

		let newQuantity = parseInt(quickQuantity.getAttribute("quantity")) + change;

		quickQuantity.innerText = newQuantity + "x";
		quickQuantity.setAttribute("quantity", newQuantity);
	},
};

async function loadQuickItems() {
	if (settings.pages.items.quickItems) {
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
				children: [document.newElement({ type: "i", class: "fas fa-plus" }), " Add"],
				events: {
					click: (event) => {
						event.stopPropagation();

						document.find("ul.items-cont[aria-expanded='true']").classList.toggle("tt-overlay-item");
						options.find("#edit-items-button").classList.toggle("tt-overlay-item");
						if (document.find(".tt-overlay").classList.toggle("hidden")) {
							for (let item of document.findAll("ul.items-cont[aria-expanded='true'] > li")) {
								if (!allowQuickItem(item.getAttribute("data-category"))) continue;

								item.removeEventListener("click", onItemClickQuickEdit);
							}
						} else {
							for (let item of document.findAll("ul.items-cont[aria-expanded='true'] > li")) {
								if (!allowQuickItem(item.getAttribute("data-category"))) continue;

								item.addEventListener("click", onItemClickQuickEdit);
							}
						}
					},
				},
			})
		);

		for (let id of quick.items) {
			addQuickItem(id, false);
		}
	} else {
		removeContainer("Quick Items");
	}
}

function addQuickItem(id, temporary = false) {
	const content = findContainer("Quick Items", { selector: ".content" });
	const innerContent = content.find(".inner-content");
	const responseWrap = content.find(".response-wrap");

	if (innerContent.find(`.item[item-id='${id}']`)) return;
	if (!allowQuickItem(torndata.items[id].type)) return;

	let itemWrap = document.newElement({
		type: "div",
		class: temporary ? "temp item" : "item",
		attributes: { "item-id": id },
		events: {
			click: () => {
				getAction({
					type: "post",
					action: "item.php",
					data: { step: "useItem", id: id, itemID: id },
					success: (str) => {
						const response = JSON.parse(str);

						const links = ["<a href='#' class='close-act t-blue h'>Close</a>"];
						if (response.links) {
							for (let link of response.links) {
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

						for (let count of responseWrap.findAll(".counter-wrap")) {
							count.classList.add("tt-modified");
							count.innerText = formatTime({ seconds: parseInt(count.dataset.time) }, { type: "timer" });
						}
						updateItemAmount(id, -1);
					},
				});
			},
		},
	});
	itemWrap.appendChild(document.newElement({ type: "div", class: "pic", attributes: { style: `background-image: url(/images/items/${id}/medium.png)` } }));
	if (hasAPIData()) {
		itemWrap.appendChild(document.newElement({ type: "div", class: "text", text: torndata.items[id].name }));

		if (settings.apiUsage.user.inventory) {
			let amount = findItemsInList(userdata.inventory, { ID: id }, { single: true });
			amount = amount ? amount.quantity : 0;

			itemWrap.appendChild(document.newElement({ type: "div", class: "sub-text quantity", attributes: { quantity: amount }, text: amount + "x" }));
		}
	} else {
		itemWrap.appendChild(document.newElement({ type: "div", class: "text", text: id }));
	}
	itemWrap.appendChild(
		document.newElement({
			type: "i",
			class: "fas fa-times tt-close-icon",
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
}

function allowQuickItem(category) {
	return ["Medical", "Drug", "Energy Drink", "Alcohol", "Candy", "Booster"].includes(category);
}

async function saveQuickItems() {
	const content = findContainer("Quick Items", { selector: ".content" });

	await ttStorage.change({ quick: { items: [...content.findAll(".item")].map((x) => parseInt(x.getAttribute("item-id"))) } });
}

async function setupQuickDragListeners() {
	for (let item of document.findAll(".items-cont[aria-expanded=true] > li[data-item]")) {
		if (!allowQuickItem(item.getAttribute("data-category"))) continue;

		const titleWrap = item.find(".title-wrap");

		titleWrap.setAttribute("draggable", "true");
		titleWrap.addEventListener("dragstart", onDragStart);
		titleWrap.addEventListener("dragend", onDragEnd);
	}

	function onDragStart(event) {
		event.dataTransfer.setData("text/plain", null);

		setTimeout(() => {
			document.find("#quickItems .content").classList.add("drag-progress");
			if (document.find("#quickItems .temp.item")) return;

			let id = parseInt(event.target.parentElement.getAttribute("data-item"));

			addQuickItem(id, true);
			// enableInjectListener();
		}, 10);
	}

	async function onDragEnd(event) {
		if (document.find("#quickItems .temp.item")) {
			document.find("#quickItems .temp.item").remove();
		}

		document.find("#quickItems .content").classList.remove("drag-progress");

		await saveQuickItems();
	}
}

async function onItemClickQuickEdit(event) {
	event.stopPropagation();
	event.preventDefault();

	const target = findParent(event.target, { hasAttribute: "data-item" });
	const id = parseInt(target.getAttribute("data-item"));

	addQuickItem(id, false);

	await saveQuickItems();
}

function updateItemAmount(id, change) {
	const quickQuantity = findContainer("Quick Items", { selector: `.item[item-id="${id}"] .quantity` });
	if (quickQuantity) {
		let newQuantity = parseInt(quickQuantity.getAttribute("quantity")) + change;

		quickQuantity.innerText = newQuantity + "x";
		quickQuantity.setAttribute("quantity", newQuantity);
	}

	// TODO - Update item value quantities.
}

async function showItemValues() {
	if (settings.pages.items.values && hasAPIData()) {
		// TODO - Show item values.
	} else {
	}
}

async function showDrugDetails() {
	if (settings.pages.items.drugDetails) {
		// TODO - Show extra drug details.
	} else {
	}
}

async function showItemMarketIcons() {
	if (settings.pages.items.marketLinks && !(await checkMobile())) {
		// TODO - Display market links.
	} else {
	}
}

async function highlightBloodBags() {
	if (settings.pages.items.marketLinks && !(await checkMobile())) {
		// TODO - Highlight blood bags.
	} else {
	}
}

/*
 * Torn Function
 */
function getAction(options) {
	options = {
		success: () => {},
		action: location.pathname,
		type: "get",
		data: {},
		async: true,
		...options,
	};

	return $.ajax({
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

"use strict";

(async () => {
	await loadDatabase();
	console.log("TT: Items - Loading script. ");

	storageListeners.settings.push(loadItems);
	loadItems();

	loadItemsOnce();

	console.log("TT: Items - Script loaded.");
})();

function loadItems() {
	requireContent().then(async () => {
		loadQuickItems().catch((error) => console.error("Couldn't load the quick items.", error));
		showItemValues().catch((error) => console.error("Couldn't show the item values.", error));
		showDrugDetails().catch((error) => console.error("Couldn't show drug details.", error));
		showItemMarketIcons().catch((error) => console.error("Couldn't show the market icons.", error));
		highlightBloodBags().catch((error) => console.error("Couldn't highlight the correct blood bags.", error));
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
}

async function loadQuickItems() {
	if (settings.pages.items.quickItems) {
		const { content } = createContainer("Quick Items", {
			nextElement: document.find(".equipped-items-wrap"),
			spacer: true,
		});
		content.appendChild(document.newElement({ type: "div", class: "inner-content" }));
		content.appendChild(document.newElement({ type: "div", class: "response-wrap" }));

		for (let id of quick.items) {
			addQuickItem(content, id, false);
		}

		function addQuickItem(content, id, temporary = false) {
			const USABLE_ITEM_TYPES = ["Medical", "Drug", "Energy Drink", "Alcohol", "Candy", "Booster"];

			if (!content) content = findContainer("Quick Items");
			const innerContent = content.find(".inner-content");
			const responseWrap = content.find(".response-wrap");

			if (innerContent.find(`.item[item-id='${id}']`)) return;
			if (!USABLE_ITEM_TYPES.includes(torndata.items[id].type)) return;

			let itemWrap = document.newElement({
				type: "div",
				class: temporary ? "temp item" : "item",
				attributes: { "item-id": id },
				events: {
					click: () => {
						console.log("Clicked Quick item");
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
							},
						});
					},
				},
			});
			itemWrap.appendChild(
				document.newElement({ type: "div", class: "pic", attributes: { style: `background-image: url(/images/items/${id}/medium.png)` } })
			);
			if (hasAPIData()) {
				itemWrap.appendChild(document.newElement({ type: "div", class: "text", text: torndata.items[id].name }));

				if (settings.apiUsage.user.inventory) {
					let amount = findItemsInList(userdata.inventory, { ID: id }, { single: true });
					amount = amount ? amount.quantity : 0;

					itemWrap.appendChild(
						document.newElement({ type: "div", class: "sub-text quantity", attributes: { quantity: amount }, text: amount + "x" })
					);
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

							await ttStorage.change({ quick: { items: [...content.findAll(".item")].map((x) => parseInt(x.getAttribute("item-id"))) } });
						},
					},
				})
			);
			innerContent.appendChild(itemWrap);
		}
	} else {
		removeContainer("Quick Items");
	}
}

async function showItemValues() {
	if (settings.pages.items.values && hasAPIData()) {
	} else {
	}
}

async function showDrugDetails() {
	if (settings.pages.items.drugDetails) {
	} else {
	}
}

async function showItemMarketIcons() {
	if (settings.pages.items.marketLinks && !(await checkMobile())) {
	} else {
	}
}

async function highlightBloodBags() {
	if (settings.pages.items.marketLinks && !(await checkMobile())) {
	} else {
	}
}

/*
 * Torn Function
 */
function getAction(obj) {
	obj.success = obj.success || (() => {});
	obj.before = obj.before || (() => {});
	obj.complete = obj.complete || (() => {});
	const url = obj.action || window.location.protocol + "//" + window.location.hostname + location.pathname;
	const options = {
		url: "https://www.torn.com/" + addRFC(url),
		type: obj.type || "get",
		data: obj.data || {},
		async: typeof obj.async !== "undefined" ? obj.async : true,
		success: (msg) => {
			console.log("success");
			obj.success(msg);
		},
		error: (xhr, ajaxOptions, thrownError) => {
			console.error("Error during action call.", thrownError);
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

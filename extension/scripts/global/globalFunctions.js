"use strict";

/*
 * Add prototype functions.
 */

Document.prototype.newElement = function (options = {}) {
	if (typeof options == "string") {
		return this.createElement(options);
	} else if (typeof options == "object") {
		options = {
			type: "div",
			id: false,
			class: false,
			text: false,
			html: false,
			value: false,
			href: false,
			children: [],
			attributes: {},
			events: {},
			style: {},
			...options,
		};

		let newElement = this.createElement(options.type);

		if (options.id) newElement.id = options.id;
		if (options.class) newElement.setAttribute("class", options.class);
		if (options.text) newElement.innerText = options.text;
		if (options.html) newElement.innerHTML = options.html;
		if (options.value) {
			if (typeof options.value === "function") newElement.value = options.value();
			else newElement.value = options.value;
		}
		if (options.href) newElement.href = options.href;

		for (let child of options.children || []) {
			if (typeof child === "string") {
				newElement.appendChild(document.createTextNode(child));
			} else {
				newElement.appendChild(child);
			}
		}

		if (options.attributes) {
			let attributes = options.attributes;
			if (typeof attributes === "function") attributes = attributes();

			for (let attribute in attributes) newElement.setAttribute(attribute, attributes[attribute]);
		}
		for (let event in options.events) newElement.addEventListener(event, options.events[event]);

		for (let key in options.style) newElement.style[key] = options.style[key];
		for (let key in options.dataset) newElement.dataset[key] = options.dataset[key];

		return newElement;
	}
};

async function setBadge(type, options = {}) {
	options = {
		events: 0,
		messages: 0,
		...options,
	};

	const TYPES = {
		default: { text: "" },
		error: { text: "error", color: "#FF0000" },
		count: {
			text: async () => {
				if (options.events && options.messages) return `${options.events}/${options.messages}`;
				else if (options.events) return options.events.toString();
				else if (options.messages) return options.messages.toString();
				else return (await getBadgeText()) === "error" ? "error" : false;
			},
			color: async () => {
				if (options.events && options.messages) return "#1ed2ac";
				else if (options.events) return "#009eda";
				else if (options.messages) return "#84af03";
				else return (await getBadgeText()) === "error" ? "error" : false;
			},
		},
	};

	const badge = TYPES[type];
	if (typeof badge.text === "function") badge.text = await badge.text();
	if (typeof badge.color === "function") badge.color = await badge.color();
	if (!badge.text) badge.text = "";

	chrome.browserAction.setBadgeText({ text: badge.text || "" });
	if (badge.color) chrome.browserAction.setBadgeBackgroundColor({ color: badge.color });
}

function getBadgeText() {
	return new Promise((resolve) => chrome.browserAction.getBadgeText({}, resolve));
}

// TODO - Use in ttItems.js
const ITEM_VALUE_UTILITIES = {
	showTotal: (list, type) => {
		if (!hasAPIData() || !settings.apiUsage.user.inventory) return;

		let total;
		if (type === "All") total = userdata.inventory.map((x) => x.quantity * x.market_price).reduce((a, b) => (a += b), 0);
		else
			total = userdata.inventory
				.filter((x) => x.type === type)
				.map((x) => x.quantity * x.market_price)
				.reduce((a, b) => (a += b), 0);

		setTimeout(() => {
			list.insertBefore(
				document.newElement({
					type: "li",
					class: "tt-ignore",
					children: [
						document.newElement({
							type: "li",
							text: `Total Value: $${formatNumber(total, { decimals: 0 })}`,
							class: "tt-item-price",
						}),
					],
				}),
				list.firstElementChild
			);
		}, 0);
	},
	removeTotal: () => {
		const total = document.find(".tt-ignore .tt-item-price");
		if (total) total.parentElement.remove();
	},
	addValue: (priceElement, quantity, price) => {
		const totalPrice = quantity * price;
		if (totalPrice) {
			if (quantity > 1) {
				priceElement.appendChild(document.newElement({ type: "span", text: `$${formatNumber(price)} | ` }));
				priceElement.appendChild(document.newElement({ type: "span", text: `${quantity}x = `, class: "tt-item-quantity" }));
			}
			priceElement.appendChild(document.newElement({ type: "span", text: `$${formatNumber(totalPrice)}` }));
		} else if (price === 0) {
			priceElement.innerText = `N/A`;
		} else {
			priceElement.innerText = `$${formatNumber(price)}`;
		}
	},
	INVENTORY: {
		showValues: async (type, items, options = {}) => {
			options = {
				ignoreUntradable: true,
				addRelative: false,
				...options,
			};

			ITEM_VALUE_UTILITIES.removeTotal();

			if (settings.pages.items.values) {
				const list = ITEM_VALUE_UTILITIES.INVENTORY.getItemCurrentList();

				if (type) ITEM_VALUE_UTILITIES.showTotal(list, type);

				for (const item of items) {
					if (options.ignoreUntradable && parseInt(item.untradable)) continue;

					requireElement(`li[data-reactid*='$${item.armoryID}'] .name-wrap`, { parent: list }).then(async () => {
						const itemRow = list.find(`li[data-reactid*='$${item.armoryID}']`);

						const parent = itemRow.find(".name-wrap");
						if (parent.find(".tt-item-price")) {
							if (type) return;
							else parent.find(".tt-item-price").remove();
						}

						if (options.addRelative) parent.parentElement.classList.add("relative");

						const price = parseInt(item.averageprice) || 0;
						const quantity = parseInt(item.Qty) || 1;

						const valueWrap = itemRow.find(".info-wrap");

						if (valueWrap && valueWrap.clientWidth && (!valueWrap.innerText.trim() || valueWrap.innerText.startsWith("$"))) {
							valueWrap.innerHTML = "";
							valueWrap.classList.add("tt-item-price-color");
							ITEM_VALUE_UTILITIES.addValue(valueWrap, quantity, price);
						} else if (valueWrap && valueWrap.clientWidth && (!valueWrap.nextSibling || !valueWrap.nextSibling.childElementCount)) {
							valueWrap.style.setProperty("position", "relative");

							const priceElement = document.newElement({ type: "span", class: "tt-item-price" });
							ITEM_VALUE_UTILITIES.addValue(priceElement, quantity, price);

							valueWrap.appendChild(priceElement);
						} else {
							const priceElement = document.newElement({ type: "span", class: "tt-item-price" });
							if (item.groupItem && quantity !== 1) priceElement.style.setProperty("padding-right", "98px", "important");

							ITEM_VALUE_UTILITIES.addValue(priceElement, quantity, price);

							if (item.groupItem) {
								if (quantity === 1) parent.insertAdjacentElement("afterend", priceElement);
								else parent.appendChild(priceElement);
							} else parent.insertAdjacentElement("afterend", priceElement);
						}
					});
				}
			} else {
				for (const price of document.findAll(".tt-item-price, #category-wrap .tt-ignore")) {
					price.remove();
				}
			}
		},
		getItemCurrentList: () => {
			return document.find(".category-wrap ul.items-cont[style*='display:block;'], .category-wrap ul.items-cont[style*='display: block;']");
		},
		addListener: (options = {}) => {
			addXHRListener(({ detail: { page, xhr, json } }) => {
				if (page === "inventory") {
					ITEM_VALUE_UTILITIES.INVENTORY.handleInventoryRequest(xhr, json, options);
				}
			});
		},
		handleInventoryRequest: (xhr, json, options = {}) => {
			const params = new URLSearchParams(xhr.requestBody);

			const step = params.get("step");
			switch (step) {
				case "getList":
				case "getListById":
					ITEM_VALUE_UTILITIES.INVENTORY.showValues(params.get("type") || false, json.list, options).catch((error) =>
						console.error("Couldn't show the item values.", error)
					);
					break;
			}
		},
	},
};

const DRUG_DETAILS = {
	showDetails: async function (id, options = {}) {
		options = {
			react: false,
			target: document,
			...options,
		};

		if (settings.pages.items.drugDetails) {
			let element;
			await sleep(0);

			if (options.react && options.target.find(".info-active .show-item-info[data-reactid]")) {
				const reactid = options.target.find(".info-active .show-item-info").dataset.reactid;

				await requireElement(`[data-reactid="${reactid}"] .ajax-placeholder`, { invert: true });

				element = options.target.find(`[data-reactid="${reactid}"]`);
			} else {
				element = options.target.find(
					".show-item-info, .view-item-info[style*='display: block;'], .buy-show-item-info, .item-info-wrap + .details[aria-expanded='true']"
				);
				await requireElement(".ajax-placeholder", { invert: true, parent: element });
			}

			const details = DRUG_INFORMATION[id];
			if (!details) return;

			this._showDetails(element.find(".info-msg"), details);

			if (document.find(`.info-wrap[aria-labelledby="armory-info-${id}-"]`)) {
				this._showDetails(document.find(`.info-wrap[aria-labelledby="armory-info-${id}-"] .info-msg`), details);
			}
		}
	},
	_showDetails: (parent, details) => {
		// Remove current info
		[...parent.findAll(".item-effect")].forEach((effect) => effect.remove());

		// Pros
		if (details.pros) {
			parent.appendChild(document.newElement({ type: "div", class: "item-effect mt10", text: "Pros:", attributes: { color: "tGreen" } }));

			for (let effect of details.pros) {
				parent.appendChild(document.newElement({ type: "div", class: "item-effect tabbed", text: effect, attributes: { color: "tGreen" } }));
			}
		}

		// Cons
		if (details.cons) {
			parent.appendChild(document.newElement({ type: "div", class: "item-effect", text: "Con", attributes: { color: "tRed" } }));

			for (let effect of details.cons) {
				parent.appendChild(document.newElement({ type: "div", class: "item-effect tabbed", text: effect, attributes: { color: "tRed" } }));
			}
		}

		// Cooldown
		if (details.cooldown) {
			parent.appendChild(
				document.newElement({ type: "div", class: "item-effect", text: `Cooldown: ${details.cooldown}`, attributes: { color: "tRed" } })
			);
		}

		// Overdose
		if (details.overdose) {
			parent.appendChild(document.newElement({ type: "div", class: "item-effect", text: "Overdose:", attributes: { color: "tRed" } }));

			// bars
			if (details.overdose.bars) {
				parent.appendChild(document.newElement({ type: "div", class: "item-effect tabbed", text: "Bars", attributes: { color: "tRed" } }));

				for (let effect of details.overdose.bars) {
					parent.appendChild(document.newElement({ type: "div", class: "item-effect double-tabbed", text: effect, attributes: { color: "tRed" } }));
				}
			}

			// hospital time
			if (details.overdose.hosp_time) {
				parent.appendChild(
					document.newElement({
						type: "div",
						class: "item-effect tabbed",
						text: `Hospital: ${details.overdose.hosp_time}`,
						attributes: { color: "tRed" },
					})
				);
			}

			// extra
			if (details.overdose.extra) {
				parent.appendChild(
					document.newElement({
						type: "div",
						class: "item-effect tabbed",
						text: `Extra: ${details.overdose.extra}`,
						attributes: { color: "tRed" },
					})
				);
			}
		}
	},
	addListener: function (options = {}) {
		options = {
			isXHR: true,
			isFetch: false,
			...options,
		};

		if (options.isXHR) {
			addXHRListener(({ detail: { page, xhr, json } }) => {
				if (page === "inventory") {
					this.handleInventoryRequest(xhr, json, options);
				}
			});
		}
		if (options.isFetch) {
			addFetchListener(({ detail: { page, fetch, json } }) => {
				if (page === "inventory") {
					this.handleInventoryRequest(fetch, json, options);
				}
			});
		}
	},
	handleInventoryRequest: function (request, json, options) {
		const params = request.url ? new URL(request.url).searchParams : new URLSearchParams(request.requestBody);

		const step = params.get("step");
		if (step !== "info") return;

		this.showDetails(json.itemID, options).catch((error) => console.error("Couldn't show drug details.", error));
	},
	addMutationObserver: function (parentSelector) {
		requireElement(parentSelector).then(() => {
			new MutationObserver(async (mutations) => {
				const viewMutations = mutations.filter((mutation) => [...mutation.addedNodes].some((node) => node.classList.contains("^=view_")));
				if (!viewMutations.length) return;

				const newNodes = viewMutations[0].addedNodes;
				let target;
				if ([...newNodes].some((node) => node.find(":scope > [class*='preloader_']"))) {
					target = await new Promise((resolve) => {
						new MutationObserver((mutations1, observer) => {
							observer.disconnect();
							resolve(mutations1[1].target);
						}).observe(newNodes[0], { childList: true });
					});
				} else {
					target = newNodes[0];
				}

				const id = parseInt(
					target
						.find(".info-wrap")
						.getAttribute("aria-labelledby")
						.match(/armory-info-([0-9]*)/i)[1]
				);

				this.showDetails(id, { target }).catch((error) => console.error("Couldn't show drug details.", error));
			}).observe(document.find(parentSelector), { subtree: true, childList: true });
		});
	},
};

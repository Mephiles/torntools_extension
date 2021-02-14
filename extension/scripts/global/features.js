"use strict";

/*
 * Add prototype functions.
 */

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
	removeTotal: (list) => {
		const total = list.find(".tt-ignore .tt-item-price");
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

			const list = ITEM_VALUE_UTILITIES.INVENTORY.getItemCurrentList();
			ITEM_VALUE_UTILITIES.removeTotal(list);

			if (settings.pages.items.values) {
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
};

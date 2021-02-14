"use strict";

(async () => {
	const page = getPage();

	if (page === "factions" && getSearchParameters().get("step") !== "your") return;
	if (page === "home" || page === "flying") return;

	featureManager.registerFeature(
		"Drug Details",
		"items",
		() => settings.pages.items.drugDetails,
		initialiseDrugDetails,
		null, // NTH - Live reload
		null, // NTH - Live reload
		{
			storage: ["settings.pages.items.drugDetails"],
		}
	);

	function initialiseDrugDetails() {
		switch (page) {
			case "item":
				setupXHR({ changeListener: true });
				break;
			case "abroad": // TODO - Finish testing.
			case "imarket":
				setupXHR();
				break;
			case "displaycase":
				setupXHR({ react: true, changeListener: true });
				break;
			case "factions":
				setupXHR({
					react: () => document.find("#faction-armoury-tabs > ul > li[aria-selected='true']").getAttribute("aria-controls") === "armoury-donate",
				});
				break;
			case "bazaar":
				addMutationObserver("[class*='itemsContainner_'], [class*='core-layout_'] [class*='items_']");
				break;
		}

		function setupXHR(options = {}) {
			addXHRListener(({ detail: { page, xhr, json } }) => {
				if (!json || page !== "inventory") return;

				handleRequest(xhr, json, options);
			});
		}

		function setupFetch(options = {}) {
			addFetchListener(({ detail: { page, fetch, json } }) => {
				if (!fetch || page !== "inventory") return;

				handleRequest(fetch, json, options);
			});
		}

		function handleRequest(request, json, options = {}) {
			const params = request.url ? new URL(request.url).searchParams : new URLSearchParams(request.requestBody);

			const step = params.get("step");
			if (step !== "info") return;

			showDetails(json.itemID, options).catch((error) => console.error("Couldn't show drug details.", error));
		}

		function addMutationObserver(selector) {
			requireElement(selector).then(() => {
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

					showDetails(id, { target }).catch((error) => console.error("Couldn't show drug details.", error));
				}).observe(document.find(selector), { subtree: true, childList: true });
			});
		}
	}

	async function showDetails(id, options = {}) {
		options = {
			react: false,
			target: document,
			...options,
		};

		if (!settings.pages.items.drugDetails) return;

		let element;

		if (options.react && (typeof options.react !== "function" || options.react()) && options.target.find(".info-active .show-item-info[data-reactid]")) {
			const reactid = options.target.find(".info-active .show-item-info").dataset.reactid;

			await requireElement(`[data-reactid="${reactid}"] .ajax-placeholder`, { invert: true });

			element = options.target.find(`[data-reactid="${reactid}"]`);
		} else {
			element = findElement();
			await requireElement(".ajax-placeholder", { invert: true, parent: element });
		}

		const details = DRUG_INFORMATION[id];
		if (!details) return;

		for (const info of [element.find(".info-msg"), document.find(`.info-wrap[aria-labelledby="armory-info-${id}-"] .info-msg`)]) {
			if (!info) continue;

			const hasInformation = info.classList.contains("tt-modified");

			show(info, details);
			if (options.changeListener && hasInformation) watchChanges(element, details);
		}

		function findElement() {
			return (
				options.target.find(`li[itemid="${id}"] .view-item-info`) ||
				options.target.find(
					".show-item-info, .view-item-info[style*='display: block;'], .buy-show-item-info, " +
						".item-info-wrap + .details[aria-expanded='true'], .details-wrap[style*='display: block;']"
				)
			);
		}

		function show(parent, details) {
			// Remove current info
			parent.classList.add("tt-modified");
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
						parent.appendChild(
							document.newElement({ type: "div", class: "item-effect double-tabbed", text: effect, attributes: { color: "tRed" } })
						);
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
		}

		function watchChanges(element, details) {
			new MutationObserver((mutations, observer) => {
				const filteredMutations = [...mutations].filter((mutation) =>
					[...mutation.addedNodes].some((node) => node.nodeType === Node.ELEMENT_NODE && node.classList.contains("info-wrap"))
				);
				if (!filteredMutations.length) return;

				const newElement = findElement();
				show(newElement.find(".info-msg"), details);
				watchChanges(newElement, details);
				observer.disconnect();
			}).observe(element, { childList: true, attributes: true, subtree: true });
		}
	}
})();

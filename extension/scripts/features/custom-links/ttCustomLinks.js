"use strict";

(async () => {
	featureManager.registerFeature(
		"Custom Links",
		"sidebar",
		() => settings.customLinks.length,
		null,
		showLinks,
		removeLinks,
		{
			storage: ["settings.customLinks"],
		},
		async () => {
			await checkDevice();
		}
	);

	async function showLinks() {
		await requireSidebar();

		if (!mobile && !tablet) {
			showOutside("above", "customLinksAbove");
			showOutside("under", "customLinksUnder");
			showInside();
		} else {
			const oldCustomLinksContainer = document.find(".tt-custom-links-container");
			if (oldCustomLinksContainer) oldCustomLinksContainer.remove();

			const customLinksContainer = document.newElement({
				type: "div",
				class: "tt-custom-links-container",
			});

			settings.customLinks.forEach((link) => {
				customLinksContainer.insertAdjacentElement(
					"beforeend",
					document.newElement({
						type: "div",
						class: "tt-slide",
						children: [
							document.newElement({
								type: "a",
								href: link.href,
								class: "tt-mobile-link",
								attributes: { target: link.newTab ? "_blank" : "" },
								children: [document.newElement({ type: "span", text: link.name })],
							}),
						],
					})
				);
			});

			document.find("#sidebar [class*='content_'] [class*='user-information-mobile_']").insertAdjacentElement("beforebegin", customLinksContainer);
			document.find(".content-wrapper[role='main']").insertAdjacentElement("afterbegin", document.newElement({ type: "div", class: "dummy-div" }));
		}
	}

	function showOutside(filter, id) {
		if (!settings.customLinks.filter((link) => link.location === filter).length) {
			removeContainer("Custom Links", { id });
			return;
		}

		const { content } = createContainer("Custom Links", {
			id,
			class: "tt-custom-link-container",
			applyRounding: false,
			contentBackground: false,
			compact: true,
			[filter === "above" ? "nextElement" : "previousElement"]: findParent(document.find("h2=Areas"), { class: "^=sidebar-block_" }),
		});

		for (const link of settings.customLinks.filter((link) => link.location === filter)) {
			content.appendChild(
				document.newElement({
					type: "a",
					class: "pill",
					href: link.href,
					text: link.name,
					attributes: { target: link.newTab ? "_blank" : "_self" },
				})
			);
		}
	}

	function showInside() {
		for (const link of document.findAll(".custom-link")) link.remove();

		const areas = findParent(document.find("h2=Areas"), { class: "^=sidebar-block_" });
		for (const link of settings.customLinks.filter((link) => link.location !== "above" && link.location !== "under")) {
			const locationSplit = link.location.split("_");

			const location = locationSplit.splice(1).join("_");
			const area = ALL_AREAS.filter((area) => area.class === location);
			if (!area) continue;
			let target = areas.find(`#nav-${area[0].class}`);
			if (!target) continue;

			if (locationSplit[0] === "under") target = target.nextSibling;

			const pill = document.newElement({
				type: "a",
				class: "pill custom-link",
				href: link.href,
				text: link.name,
				attributes: { target: link.newTab ? "_blank" : "_self" },
			});
			const parent = areas.find("div[class*='toggle-content_']");
			if (target) parent.insertBefore(pill, target);
			else parent.appendChild(pill);
		}
	}

	function removeLinks() {
		if (mobile) {
			const customLinksContainer = document.find(".tt-custom-links-container");
			if (customLinksContainer) customLinksContainer.remove();
		} else {
			removeContainer("Custom Links", { id: "customLinksAbove" });
			removeContainer("Custom Links", { id: "customLinksUnder" });
		}

		for (const link of document.findAll(".custom-link")) link.remove();
	}
})();

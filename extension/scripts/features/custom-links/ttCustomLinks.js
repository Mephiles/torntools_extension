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
			await checkMobile();
		}
	);

	async function showLinks() {
		await requireSidebar();

		if (!mobile) {
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
				customLinksContainer.insertAdjacentHTML(
					"beforeend",
					`
						<div class="tt-slide">
							<a href="${link.href}" class="tt-mobile-link" target="${link.newTab ? "_blank" : ""}">
								<span>${link.name}</span>
							</a>
						</div>
					`
				);
			});

			document.find("#sidebar [class*='content_'] [class*='user-information-mobile_']").insertAdjacentElement("beforebegin", customLinksContainer);

			document.find(".content-wrapper[role='main']").insertAdjacentHTML("afterbegin", "<div class='dummy-div'></div>");
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
					type: "div",
					class: "pill",
					children: [
						document.newElement({
							type: "a",
							href: link.href,
							text: link.name,
							attributes: {
								target: link.newTab ? "_blank" : "_self",
							},
						}),
					],
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
				type: "div",
				class: "pill custom-link",
				children: [
					document.newElement({
						type: "a",
						href: link.href,
						text: link.name,
						attributes: {
							target: link.newTab ? "_blank" : "",
						},
					}),
				],
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

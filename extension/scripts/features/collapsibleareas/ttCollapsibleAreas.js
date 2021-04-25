"use strict";

(async () => {
	featureManager.registerFeature(
		"Collapse Areas",
		"sidebar",
		() => settings.pages.sidebar.collapseAreas,
		null,
		addCollapseIcon,
		removeCollapseIcon,
		{
			storage: ["settings.pages.sidebar.collapseAreas"],
		},
		null
	);

	async function addCollapseIcon() {
		await requireSidebar();
		if (!document.find("[class='header-arrow']") && !mobile) {
			let areasIElement = document.newElement({ type: "i", class: "icon fas fa-caret-down" });
			let areasHeader = document.find("h2=Areas");
			areasHeader.classList.add("tt-title-torn");
			areasHeader.appendChild(areasIElement);
			if (filters.containers.collapseAreas) areasHeader.classList.add("collapsed");
			areasHeader.addEventListener("click", clickListener);
		}
	}

	async function removeCollapseIcon() {
		await requireSidebar();
		if (!document.find("[class='header-arrow']") && !mobile) {
			let areasHeader = document.find("h2=Areas");
			areasHeader.classList.remove("tt-title-torn");
			areasHeader.find(".icon").remove();
			if (areasHeader.classList.contains("collapsed")) areasHeader.classList.remove("collapsed");
			areasHeader.removeEventListener("click", clickListener);
		}
	}

	async function clickListener() {
		let areasHeader = document.find("h2=Areas");
		areasHeader.classList.toggle("collapsed");
		let collapsed = areasHeader.classList.contains("collapsed");
		await ttStorage.change({ filters: { containers: { collapseAreas: collapsed } } });
	}
})();

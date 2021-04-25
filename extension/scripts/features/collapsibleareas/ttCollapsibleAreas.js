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
		() => {
			if (mobile) return "Shouldn't be on mobile";
		}
	);

	async function addCollapseIcon() {
		await requireSidebar();
		const areasIElement = document.newElement({ type: "i", class: "icon fas fa-caret-down" });
		const areasHeader = document.find("h2=Areas");
		areasHeader.classList.add("tt-title-torn");
		areasHeader.appendChild(areasIElement);
		if (filters.containers.collapseAreas) areasHeader.classList.add("collapsed");
		areasHeader.addEventListener("click", clickListener);
	}

	async function removeCollapseIcon() {
		await requireSidebar();
		const areasHeader = document.find("h2=Areas");
		areasHeader.classList.remove("tt-title-torn");
		areasHeader.find(".icon").remove();
		if (areasHeader.classList.contains("collapsed")) areasHeader.classList.remove("collapsed");
		areasHeader.removeEventListener("click", clickListener);
	}

	async function clickListener() {
		const areasHeader = document.find("h2=Areas");
		const collapsed = areasHeader.classList.toggle("collapsed");
		await ttStorage.change({ filters: { containers: { collapseAreas: collapsed } } });
	}
})();

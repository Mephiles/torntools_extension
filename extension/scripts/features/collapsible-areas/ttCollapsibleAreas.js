"use strict";

(async () => {
	if ((await checkDevice()).mobile) return "Not supported on mobile!";

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
		async () => {
			await requireSidebar();

			if (document.find("#sidebarroot .tablet")) return "Already collapsible.";
		}
	);

	let observer;

	async function addCollapseIcon() {
		const header = document.find("h2=Areas");
		if (header.classList.contains("tt-title-torn")) return;

		header.classList.add("tt-title-torn");
		if (filters.containers.collapseAreas) header.classList.add("collapsed");
		header.addEventListener("click", clickListener);

		const icon = document.newElement({ type: "i", class: "icon fas fa-caret-down" });
		header.appendChild(icon);

		observer = new MutationObserver(() => {
			if (!header.classList.contains("tt-title-torn")) header.classList.add("tt-title-torn");
		});
		observer.observe(header, { attributes: true, attributeFilter: ["class"] });
	}

	async function removeCollapseIcon() {
		if (observer) observer.disconnect();

		const header = document.find("h2=Areas");
		if (!header) return;

		header.classList.remove("tt-title-torn", "collapsed");
		header.removeEventListener("click", clickListener);

		if (header.find(".icon")) header.find(".icon").remove();
	}

	async function clickListener() {
		const areasHeader = document.find("h2=Areas");
		const collapsed = areasHeader.classList.toggle("collapsed");

		await ttStorage.change({ filters: { containers: { collapseAreas: collapsed } } });
	}
})();

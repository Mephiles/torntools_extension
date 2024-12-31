"use strict";

(async () => {
	const { hasSidebar } = await checkDevice();
	if (!hasSidebar) return "Not supported on mobiles or tablets!";

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
		}
	);

	let observer;

	async function addCollapseIcon() {
		const title = document.find("h2=Areas");
		if (title.classList.contains("tt-title-torn")) return;

		const header = title.parentElement;

		header.classList.add("tt-areas-header");
		title.classList.add("tt-title-torn");
		if (filters.containers.collapseAreas) header.classList.add("collapsed");
		title.addEventListener("click", clickListener);

		const icon = document.newElement({ type: "i", class: "icon fa-solid fa-caret-down" });
		title.appendChild(icon);

		observer = new MutationObserver(() => {
			if (!title.classList.contains("tt-title-torn")) title.classList.add("tt-title-torn");
		});
		observer.observe(title, { attributes: true, attributeFilter: ["class"] });
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
		const header = document.find("h2=Areas").parentElement;
		const collapsed = header.classList.toggle("collapsed");

		await ttStorage.change({ filters: { containers: { collapseAreas: collapsed } } });
	}
})();

"use strict";

function createContainer(title, options = {}) {
	options = {
		id: title.camelCase(true),
		parentElement: false,
		nextElement: false,
		previousElement: false,
		showHeader: true,
		onlyHeader: false,
		collapsible: true,
		applyRounding: true,
		spacer: false,
		contentBackground: true,
		allowDragging: false,
		flexContainer: false,
		compact: false,
		alwaysContent: false,
		filter: false,
		...options,
	};
	if (options.onlyHeader) options.collapsible = false;

	const { container, collapsed } = _createContainer(title, options);

	let parentElement;
	if (options.parentElement) parentElement = options.parentElement;
	else if (options.nextElement) parentElement = options.nextElement.parentElement;
	else if (options.previousElement) parentElement = options.previousElement.parentElement;
	else parentElement = document.find(".content-wrapper");

	if (options.nextElement) parentElement.insertBefore(container, options.nextElement);
	else if (options.previousElement) parentElement.insertBefore(container, options.previousElement.nextSibling);
	else parentElement.appendChild(container);

	return { container, content: container.find(":scope > main"), options: container.find(".options"), collapsed };

	function _createContainer(title, options = {}) {
		if (document.find(`#${options.id}`)) document.find(`#${options.id}`).remove();

		const containerClasses = ["tt-container"];
		if (options.collapsible) containerClasses.push("collapsible");
		if (options.applyRounding) containerClasses.push("rounding");
		if (options.spacer) containerClasses.push("spacer");
		if (options.compact) containerClasses.push("compact");
		if (options.alwaysContent) containerClasses.push("always-content");
		if (options.class) containerClasses.push(...options.class.split(" "));
		if (options.filter) containerClasses.push("tt-filter");

		const mainClasses = [];
		if (options.contentBackground) mainClasses.push("background");
		if (options.flexContainer) mainClasses.push("t-flex");

		containerClasses.push("tt-theme-background");
		const container = document.newElement({ type: "div", class: containerClasses.join(" "), id: options.id });

		const collapsed = options.onlyHeader || (options.collapsible && (options.id in filters.containers ? filters.containers[options.id] : false));

		let html = "";
		if (options.showHeader)
			html += `
				<div class="title ${collapsed ? "collapsed" : ""}">
					<div class="text">${title}</div>
					<div class="options"></div>
					${options.collapsible ? "<i class='icon fa-solid fa-caret-down'></i>" : ""}
				</div>`;
		if (!options.onlyHeader) html += `<main class="${mainClasses.join(" ")}"></main>`;
		container.innerHTML = html;

		if (options.collapsible) {
			container.find(".title").addEventListener("click", async () => {
				container.find(".title").classList.toggle("collapsed");

				await ttStorage.change({ filters: { containers: { [options.id]: container.find(".title").classList.contains("collapsed") } } });
			});
		}
		if (options.allowDragging) {
			const content = container.find(":scope > main");
			content.addEventListener("dragover", (event) => event.preventDefault());
			content.addEventListener("drop", (event) => {
				if (content.find(".temp.item, .temp.quick-item")) content.find(".temp.item, .temp.quick-item").classList.remove("temp");

				// Firefox opens new tab when dropping item
				event.preventDefault();
				event.dataTransfer.clearData();
			});
		}

		return { container, collapsed };
	}
}

function findContainer(title, options = {}) {
	options = {
		id: title.camelCase(true),
		selector: false,
		...options,
	};

	if (!options.id) return false;

	const container = document.find(`#${options.id}`);
	if (!container) return false;

	if (options.selector) return container.find(options.selector);
	else return container;
}

function removeContainer(title, options = {}) {
	const container = findContainer(title, options);
	if (!container) return;

	container.remove();
}

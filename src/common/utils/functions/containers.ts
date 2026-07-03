import "./containers.css";
import { ttStorage } from "@common/utils/context";
import { filters } from "@common/utils/data/database";
import { elementBuilder } from "@common/utils/functions/dom";
import { camelCase } from "@common/utils/functions/formatting";
import { PHFillCaretDown } from "@common/utils/icons/phosphor-icons";

type ContainerPosition = { parentElement: Node } | { nextElement: Node } | { previousElement: Node } | { defaultPosition: true };

type ContainerOptions = {
	id: string;
	class: string | (string | null)[];
	showHeader: boolean;
	onlyHeader: boolean;
	collapsible: boolean;
	applyRounding: boolean;
	spacer: boolean;
	contentBackground: boolean;
	allowDragging: boolean;
	flexContainer: boolean;
	compact: boolean;
	alwaysContent: boolean;
	filter: boolean;
	resetStyles: boolean;
} & ContainerPosition;

interface Container {
	container: HTMLElement;
	content: HTMLElement;
	options: HTMLElement;
	collapsed: boolean;
}

export function createContainer(title: string, partialOptions: Partial<ContainerOptions> & ContainerPosition): Container {
	const options: ContainerOptions = {
		id: camelCase(title),
		class: [],
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
		resetStyles: false,
		...partialOptions,
	};
	if (options.onlyHeader) options.collapsible = false;

	const { container, collapsed } = _createContainer(title, options);

	let parentElement: Node;
	if ("parentElement" in options) parentElement = options.parentElement;
	else if ("nextElement" in options) parentElement = options.nextElement.parentElement!;
	else if ("previousElement" in options) parentElement = options.previousElement.parentElement!;
	else parentElement = document.querySelector(".content-wrapper")!;

	if ("nextElement" in options) parentElement.insertBefore(container, options.nextElement);
	else if ("previousElement" in options) parentElement.insertBefore(container, options.previousElement.nextSibling);
	else parentElement.appendChild(container);

	return { container, content: container.querySelector(":scope > main")!, options: container.querySelector(".options")!, collapsed };

	function _createContainer(title: string, options: ContainerOptions) {
		document.querySelector(`#${options.id}`)?.remove();

		const containerClasses = ["tt-container"];
		if (options.collapsible) containerClasses.push("collapsible");
		if (options.applyRounding) containerClasses.push("rounding");
		if (options.spacer) containerClasses.push("spacer");
		if (options.compact) containerClasses.push("compact");
		if (options.alwaysContent) containerClasses.push("always-content");
		if (options.class) {
			let classes: string[];
			if (typeof options.class === "string") classes = options.class.split(" ").filter((c) => !!c);
			else classes = options.class.filter((c): c is string => !!c);

			containerClasses.push(...classes);
		}
		if (options.filter) containerClasses.push("tt-filter");
		if (options.resetStyles) containerClasses.push("reset-styles");

		const mainClasses: string[] = [];
		if (options.contentBackground) mainClasses.push("background");
		if (options.flexContainer) mainClasses.push("t-flex");

		containerClasses.push("tt-theme-background");
		const container = elementBuilder({ type: "div", class: containerClasses.join(" "), id: options.id });

		const collapsed: boolean = options.onlyHeader || (options.collapsible && (options.id in filters.containers ? filters.containers[options.id] : false));

		if (options.showHeader) {
			container.appendChild(
				elementBuilder({
					type: "div",
					class: ["title", collapsed ? "collapsed" : null],
					children: [
						elementBuilder({ type: "div", class: "text", text: title }),
						elementBuilder({ type: "div", class: "options" }),
						options.collapsible ? PHFillCaretDown({ class: "icon" }) : null,
					],
				}),
			);
		}
		if (!options.onlyHeader) {
			container.appendChild(elementBuilder({ type: "main", class: mainClasses }));
		}

		if (options.collapsible) {
			container.querySelector(".title")!.addEventListener("click", async () => {
				container.querySelector(".title")!.classList.toggle("collapsed");

				await ttStorage.change({ filters: { containers: { [options.id]: container.querySelector(".title")!.classList.contains("collapsed") } } });
			});
		}
		if (options.allowDragging) {
			const content = container.querySelector<HTMLElement>(":scope > main")!;
			content.addEventListener("dragover", (event) => event.preventDefault());
			content.addEventListener("drop", (event) => {
				if (content.querySelector(".temp.item, .temp.quick-item")) content.querySelector(".temp.item, .temp.quick-item")!.classList.remove("temp");

				// Firefox opens new tab when dropping item
				event.preventDefault();
				(event as DragEvent).dataTransfer?.clearData();
			});
		}

		return { container, collapsed };
	}
}

interface FindContainerOptions {
	id: string;
	selector: undefined | string;
}

export function findContainer(title: string, partialOptions: Partial<FindContainerOptions> = {}): HTMLElement | null {
	const options: FindContainerOptions = {
		id: camelCase(title),
		selector: undefined,
		...partialOptions,
	};

	if (!options.id) return null;

	const container = document.querySelector<HTMLElement>(`#${options.id}`);
	if (!container) return null;

	if (options.selector) return container.querySelector(options.selector);
	else return container;
}

export function removeContainer(title: string, partialOptions: Partial<FindContainerOptions> = {}): void {
	const container = findContainer(title, partialOptions);
	if (!container) return;

	container.remove();
}

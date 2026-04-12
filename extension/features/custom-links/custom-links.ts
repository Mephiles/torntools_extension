import { Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { createContainer, removeContainer } from "@/utils/common/functions/containers";
import { elementBuilder, findAllElements, findParent, hasSidebar, mobile } from "@/utils/common/functions/dom";
import { requireSidebar } from "@/utils/common/functions/requires";
import { ALL_AREAS, CUSTOM_LINKS_PRESET, getSidebarArea } from "@/utils/common/functions/torn";
import "./custom-links.css";

interface BaseCustomLink {
	newTab: boolean;
	location: string;
	name: string;
}

export type SavedCustomLink = BaseCustomLink & ({ preset: string } | { href: string });

type InternalCustomLink = BaseCustomLink & { href: string };

async function showLinks() {
	await requireSidebar();

	const links = getPopulatedLinks();
	if (hasSidebar) {
		showOutside("above", "customLinksAbove", links);
		showOutside("under", "customLinksUnder", links);
		showInside(links);
	} else {
		const oldCustomLinksContainer = document.querySelector(".tt-custom-links-container");
		if (oldCustomLinksContainer) oldCustomLinksContainer.remove();

		const customLinksContainer = elementBuilder({
			type: "div",
			class: "tt-custom-links-container",
		});

		links.forEach((link) => {
			customLinksContainer.insertAdjacentElement(
				"beforeend",
				elementBuilder({
					type: "div",
					class: "tt-slide",
					children: [
						elementBuilder({
							type: "a",
							href: link.href,
							class: "tt-mobile-link",
							attributes: { target: link.newTab ? "_blank" : "" },
							children: [elementBuilder({ type: "span", text: link.name })],
						}),
					],
				}),
			);
		});

		document.querySelector("#sidebar [class*='content_'] [class*='user-information-mobile_']").insertAdjacentElement("beforebegin", customLinksContainer);
		document.querySelector(".content-wrapper[role='main']").insertAdjacentElement(
			"afterbegin",
			elementBuilder({
				type: "div",
				class: "dummy-div",
			}),
		);
	}
}

function getPopulatedLinks(): InternalCustomLink[] {
	return settings.customLinks.map((link) => {
		if ("preset" in link) {
			return {
				newTab: link.newTab,
				location: link.location,
				name: link.name,
				href: CUSTOM_LINKS_PRESET[link.preset].link,
			};
		} else {
			return link;
		}
	});
}

function showOutside(filter: "above" | "under", id: string, links: InternalCustomLink[]) {
	if (!getPopulatedLinks().filter((link) => link.location === filter).length) {
		removeContainer("Custom Links", { id });
		return;
	}

	const { content } = createContainer("Custom Links", {
		id,
		defaultPosition: true,
		class: "tt-custom-link-container",
		applyRounding: false,
		contentBackground: false,
		compact: true,
		[filter === "above" ? "nextElement" : "previousElement"]: findParent(getSidebarArea(), { partialClass: "sidebar-block_" }),
	});

	for (const link of links.filter((link) => link.location === filter)) {
		content.appendChild(
			elementBuilder({
				type: "a",
				class: "pill",
				href: link.href,
				text: link.name,
				attributes: { target: link.newTab ? "_blank" : "_self" },
			}),
		);
	}
}

function showInside(links: InternalCustomLink[]) {
	for (const link of findAllElements(".custom-link")) link.remove();

	const areas = findParent(getSidebarArea(), { partialClass: "sidebar-block_" });
	for (const link of links.filter((link) => link.location !== "above" && link.location !== "under")) {
		const locationSplit = link.location.split("_");

		const location = locationSplit.splice(1).join("_");
		const area = ALL_AREAS.filter((area) => area.class === location);
		if (!area) continue;
		let target = areas.querySelector(`#nav-${area[0].class}`);
		if (!target) continue;

		if (locationSplit[0] === "under") target = target.nextSibling as HTMLElement;

		const pill = elementBuilder({
			type: "a",
			class: "pill custom-link",
			href: link.href,
			text: link.name,
			attributes: { target: link.newTab ? "_blank" : "_self" },
		});
		const parent = areas.querySelector("div[class*='toggle-content_']");
		if (target) parent.insertBefore(pill, target);
		else parent.appendChild(pill);
	}
}

function removeLinks() {
	if (mobile) {
		const customLinksContainer = document.querySelector(".tt-custom-links-container");
		if (customLinksContainer) customLinksContainer.remove();
	} else {
		removeContainer("Custom Links", { id: "customLinksAbove" });
		removeContainer("Custom Links", { id: "customLinksUnder" });
	}

	for (const link of findAllElements(".custom-link")) link.remove();
}

export default class CustomLinksFeature extends Feature {
	constructor() {
		super("Custom Links", "sidebar");
	}

	isEnabled() {
		return !!settings.customLinks.length;
	}

	async execute() {
		await showLinks();
	}

	cleanup() {
		removeLinks();
	}

	storageKeys() {
		return ["settings.customLinks"];
	}
}

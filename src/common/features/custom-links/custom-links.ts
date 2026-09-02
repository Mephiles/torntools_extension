import { settings } from "@common/utils/data/database";
import { createContainer, removeContainer } from "@common/utils/functions/containers";
import { elementBuilder, findParent, hasSidebar } from "@common/utils/functions/dom";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { requireSidebar } from "@common/utils/functions/requires";
import { ALL_AREAS, CUSTOM_LINKS_PRESET, getSidebarArea, isPageWithSidebar } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
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
		findElement(".tt-custom-links-container", true).remove();

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

		findElement("#sidebar [class*='user-information-mobile_'], #sidebar [class*='userInformationMobile___']").insertAdjacentElement(
			"beforebegin",
			customLinksContainer,
		);
		findElement(".content-wrapper[role='main']").insertAdjacentElement(
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
		[filter === "above" ? "nextElement" : "previousElement"]:
			findParent(getSidebarArea(), { partialClass: "sidebar-block_" }) ?? findElement("#sidebar [class*=areas___]"),
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

	const areas = findParent(getSidebarArea(), { partialClass: "sidebar-block_" }) ?? findElement("#sidebar [class*=areas___]", true);
	for (const link of links.filter((link) => link.location !== "above" && link.location !== "under")) {
		const locationSplit = link.location.split("_");

		const location = locationSplit.splice(1).join("_");
		const area = ALL_AREAS.filter((area) => area.class === location);
		if (!area) continue;
		let target = findElement(`#nav-${area[0].class}`, areas, true);
		if (!target) continue;

		if (locationSplit[0] === "under") target = target.nextSibling as HTMLElement;

		const pill = elementBuilder({
			type: "a",
			class: "pill custom-link",
			href: link.href,
			text: link.name,
			attributes: { target: link.newTab ? "_blank" : "_self" },
		});
		const parent = findElement("div[class*='toggle-content_']", areas);
		if (target) parent.insertBefore(pill, target);
		else parent.appendChild(pill);
	}
}

export default class CustomLinksFeature extends Feature {
	constructor() {
		super("Custom Links", "sidebar");
	}

	override precondition() {
		return isPageWithSidebar();
	}

	override isEnabled() {
		return !!settings.customLinks.length;
	}

	override async execute() {
		await showLinks();
	}

	override storageKeys() {
		return ["settings.customLinks"];
	}
}

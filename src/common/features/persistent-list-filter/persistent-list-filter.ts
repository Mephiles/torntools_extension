import { ttStorage } from "@common/utils/context.ts";
import { localdata, settings } from "@common/utils/data/database";
import { findAllElements } from "@common/utils/functions/find-elements.ts";
import { requireElementOptionally } from "@common/utils/functions/requires";
import { Feature } from "@features/feature";
import { isElement } from "@floating-ui/utils/dom";
import { captureHash, getListFromHref, isOwnHash, LIST_TYPES } from "./list-hash";
import type { ListType } from "./list-hash";

const LIST_LINK_SELECTORS: Record<ListType, string> = {
	friends: '[id="nav-friends_list"] a[href*="type=friends"]',
	enemies: '[id="nav-enemies_list"] a[href*="type=enemies"]',
	targets: '[id="nav-targets_list"] a[href*="type=targets"]',
};

const LIST_LINK_SELECTOR = Object.values(LIST_LINK_SELECTORS).join(", ");

function applyLinks() {
	LIST_TYPES.filter((list) => settings.pages[list].nativeFilter && localdata.nativeFilters[list]).forEach((list) => {
		const hash = localdata.nativeFilters[list];

		findAllElements(LIST_LINK_SELECTORS[list]).forEach((link) => {
			const current = link.getAttribute("href") ?? "";
			const href = current.split("#")[0];
			const updated = hash ? `${href}#${hash}` : href;

			if (current !== updated) link.setAttribute("href", updated);
		});
	});

	applyCustomLinks();
}

function applyCustomLinks() {
	if (!settings.pages.customLinks.nativeFilter) return;

	findAllElements<HTMLAnchorElement>(".tt-custom-link-container a.pill[href], .tt-custom-links-container a[href], a.pill.custom-link[href]").forEach(
		(link) => {
			const current = link.getAttribute("href") ?? "";
			const base = current.split("#")[0];
			const existing = current.slice(base.length + 1);

			if (!isOwnHash(existing, link.dataset.ttFilterHash)) return;

			const list = getListFromHref(current, location.origin);
			const hash = list && settings.pages[list].nativeFilter ? localdata.nativeFilters[list] : "";
			const updated = hash ? `${base}#${hash}` : base;

			if (hash) link.dataset.ttFilterHash = hash;

			if (current !== updated) link.setAttribute("href", updated);
		},
	);
}

function storeCapturedHash(initialLoad: boolean) {
	const list = getListFromHref(location.href, location.origin);
	if (!list || !settings.pages[list].nativeFilter) return;

	const hash = captureHash(location.hash, initialLoad);
	if (hash === null) return;

	void ttStorage.change({ localdata: { nativeFilters: { [list]: hash } } });
}

function syncCaptureListener() {
	const list = getListFromHref(location.href, location.origin);
	if (!list || !settings.pages[list].nativeFilter) return;

	window.addEventListener("hashchange", () => storeCapturedHash(false));
}

function rememberedHash(href: string) {
	const list = getListFromHref(href, location.origin);
	if (!list || !settings.pages[list].nativeFilter) return null;

	return localdata.nativeFilters[list];
}

// Workaround for the React-managed links.
function onListLinkClick(event: MouseEvent) {
	if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
	if (!isElement(event.target)) return;

	const link = event.target.closest<HTMLAnchorElement>(LIST_LINK_SELECTOR);
	if (!link) return;

	const href = link.href.split("#")[0];
	const hash = rememberedHash(href);
	if (!hash) return;

	event.preventDefault();
	event.stopPropagation();

	location.assign(`${href}#${hash}`);
}

export default class PersistentListFilterFeature extends Feature {
	constructor() {
		super("Persistent List Filter", "sidebar");
	}

	override isEnabled() {
		return LIST_TYPES.some((list) => settings.pages[list].nativeFilter);
	}

	override async initialise() {
		window.addEventListener("click", onListLinkClick, true);

		const sidebar = await requireElementOptionally("#sidebar");
		if (!sidebar) return;

		const observer = new MutationObserver(() => applyLinks());
		observer.observe(sidebar, { childList: true, subtree: true, attributes: true, attributeFilter: ["href"] });

		applyLinks();
	}

	override execute() {
		storeCapturedHash(true);
		applyLinks();
		syncCaptureListener();
	}

	override reload() {
		applyLinks();
	}

	override storageKeys() {
		return [
			...LIST_TYPES.map((list) => `settings.pages.${list}.nativeFilter`),
			...LIST_TYPES.map((list) => `localdata.nativeFilters.${list}`),
			"settings.pages.customLinks.nativeFilter",
		];
	}
}

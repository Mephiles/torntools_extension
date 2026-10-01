import "./lease-price-recommendation.css";
import { ttCache } from "@common/utils/data/cache";
import { settings, torndata, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { createContainer, removeContainer } from "@common/utils/functions/containers";
import { elementBuilder, getHashParameters } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { formatNumber } from "@common/utils/functions/formatting";
import { requireCondition, requireElementOptionally } from "@common/utils/functions/requires";
import { getPageStatus, updateReactInput } from "@common/utils/functions/torn";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import { Feature } from "@features/feature";
import { computeDailyRateStats, computeLeasePriceStats } from "@features/lease-price-recommendation/lease-price-stats";
import type { DailyRateStats, LeasePriceStats } from "@features/lease-price-recommendation/lease-price-stats";
import type { MarketRentalsResponse } from "tornapi-typescript";

const CONTAINER_TITLE = "Market Prices";
const CACHE_SECTION = "propertyRentals";
const CACHE_TTL = TO_MILLIS.MINUTES * 5;
const FETCH_LIMIT = 100;
const MAX_PAGES = 5;
const DAYS_DEBOUNCE_MS = 300;
const LOG_PREFIX = "[TornTools] Lease Price Recommendation -";

let daysDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let activeRequestId = 0;
let marketObserver: MutationObserver | null = null;
let startInFlight = false;

function log(...args: unknown[]) {
	console.warn(LOG_PREFIX, ...args);
}

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.PROPERTIES__ROUTE, async ({ route: { page, paramTab } }) => {
		if (page !== "options" || paramTab !== "lease") {
			teardown();
			return;
		}

		await startFeature();
	});
	addCustomListener(EVENT_CHANNELS.PROPERTIES__ROUTE_PAGE, async ({ route: { page, paramTab } }) => {
		if (page !== "options" || paramTab !== "lease") {
			teardown();
			return;
		}

		await startFeature();
	});
}

async function startFeature() {
	if (startInFlight) return;
	startInFlight = true;

	try {
		if (!isLeaseRoute()) {
			teardown();
			return;
		}

		const optionsPanel = await requireElementOptionally(".property-option", { timeout: TO_MILLIS.SECONDS * 10 });
		if (!optionsPanel) {
			log("`.property-option` not found on lease route.");
			return;
		}

		// `.lease-opt` is preferred but not required — Torn markup can vary.
		await requireElementOptionally(".lease-opt, #tab-menu-lease", { timeout: TO_MILLIS.SECONDS * 5 });
		bindTabListeners();
		watchForMarketForm(optionsPanel);

		if (!isMarketPanelVisible()) {
			log("Lease route active, but rental-market panel is not visible yet. Waiting for tab/form.");
			renderPanel({
				state: "message",
				text: "Switch to Add Property to Rental Market to see price recommendations.",
			});
			return;
		}

		const daysInput = await waitForDaysInput();
		if (!daysInput) {
			log("Market panel looks visible, but days input was not found.", {
				market: !!findElement("#market", true),
				leaseInput: !!findElement("#market .lease-input, #market input[data-name='days']", true),
			});
			renderPanel({
				state: "message",
				text: "Could not find the rental-market days field. Report this if it keeps happening.",
			});
			return;
		}

		bindDaysListener();
		await refreshRecommendation();
	} finally {
		startInFlight = false;
	}
}

function watchForMarketForm(root: Element) {
	marketObserver?.disconnect();
	marketObserver = new MutationObserver(() => {
		if (!isLeaseRoute()) {
			teardown();
			return;
		}

		if (!isMarketPanelVisible()) return;
		if (!getDaysInput()) return;

		void startFeature();
	});
	marketObserver.observe(root, { childList: true, subtree: true, attributes: true });
}

function bindTabListeners() {
	const tabMenu = findElement("#tab-menu-lease, .lease-opt .ui-tabs-nav, .lease-opt ul.tabs", true);
	if (!tabMenu || tabMenu.dataset.ttLeasePriceBound === "true") return;

	tabMenu.dataset.ttLeasePriceBound = "true";
	tabMenu.addEventListener("click", (event) => {
		const target = event.target;
		if (!(target instanceof Element)) return;

		const marketTab = target.closest("#leasemarket, #market1, a[href='#market'], [aria-controls='market']");
		if (marketTab) {
			void showWhenMarketReady();
			return;
		}

		const personTab = target.closest("#leaseperson, #user1, a[href='#user'], [aria-controls='user']");
		if (personTab) {
			renderPanel({
				state: "message",
				text: "Switch to Add Property to Rental Market to see price recommendations.",
			});
		}
	});
}

async function showWhenMarketReady() {
	try {
		await requireCondition(() => isMarketPanelVisible() && !!getDaysInput(), { delay: 50, maxCycles: 80 });
		await startFeature();
	} catch (error) {
		log("Rental-market tab did not become ready in time.", error);
	}
}

function isVisible(element: Element) {
	if (element.getAttribute("aria-hidden") === "true") return false;
	if (element.getAttribute("aria-expanded") === "false") return false;

	const style = window.getComputedStyle(element);
	if (style.display === "none" || style.visibility === "hidden") return false;

	// Prefer style/aria over checkVisibility — Torn tab panels often fail checkVisibility.
	if (typeof element.checkVisibility === "function") {
		try {
			if (element.checkVisibility()) return true;
		} catch {
			// Ignore and trust style checks above.
		}
	}

	return true;
}

function isMarketTabSelected() {
	return !!findElement(
		[
			"#leasemarket.ui-tabs-active",
			"#leasemarket.ui-state-active",
			"#market1.ui-tabs-active",
			"#market1.ui-state-active",
			"#tab-menu-lease .ui-tabs-active a[href='#market']",
			"#tab-menu-lease .ui-state-active a[href='#market']",
			".lease-opt .ui-tabs-active a[href='#market']",
			".lease-opt .ui-state-active a[href='#market']",
			".lease-opt .ui-tabs-active [aria-controls='market']",
			".lease-opt .ui-state-active [aria-controls='market']",
		].join(", "),
		true,
	);
}

function isPersonTabSelected() {
	return !!findElement(
		[
			"#leaseperson.ui-tabs-active",
			"#leaseperson.ui-state-active",
			"#user1.ui-tabs-active",
			"#user1.ui-state-active",
			"#tab-menu-lease .ui-tabs-active a[href='#user']",
			"#tab-menu-lease .ui-state-active a[href='#user']",
			".lease-opt .ui-tabs-active a[href='#user']",
			".lease-opt .ui-state-active a[href='#user']",
			".lease-opt .ui-tabs-active [aria-controls='user']",
			".lease-opt .ui-state-active [aria-controls='user']",
		].join(", "),
		true,
	);
}

function isMarketPanelVisible() {
	// Person-lease tab also has days/cost inputs — never treat that as the rental market.
	if (isPersonTabSelected()) return false;
	if (isMarketTabSelected()) return true;

	const marketPanel = findElement("#market", true);
	return !!marketPanel && isVisible(marketPanel);
}

async function waitForDaysInput() {
	const existing = getDaysInput();
	if (existing) return existing;

	return requireElementOptionally("#market input[data-name='days']:not([type='hidden']), #market .lease-input input[data-name='days']", {
		timeout: TO_MILLIS.SECONDS * 5,
	});
}

function bindDaysListener() {
	const daysInput = getDaysInput();
	if (!daysInput || daysInput.dataset.ttLeasePriceBound === "true") return;

	daysInput.dataset.ttLeasePriceBound = "true";
	daysInput.addEventListener("input", () => {
		if (daysDebounceTimer) clearTimeout(daysDebounceTimer);
		daysDebounceTimer = setTimeout(() => {
			void refreshRecommendation();
		}, DAYS_DEBOUNCE_MS);
	});
}

function getDaysInput() {
	return findElement<HTMLInputElement>(
		[
			"#market input.lease.input-money[data-name='days']:not([type='hidden'])",
			"#market input.input-money[data-name='days']:not([type='hidden'])",
			"#market input[data-name='days']:not([type='hidden'])",
		].join(", "),
		true,
	);
}

function getCostInput() {
	return findElement<HTMLInputElement>(
		[
			"#market input.lease.input-money[data-name='money']:not([type='hidden'])",
			"#market input.input-money[data-name='money']:not([type='hidden'])",
			"#market input[data-name='money']:not([type='hidden'])",
		].join(", "),
		true,
	);
}

function getPropertyId(): number | null {
	const fromHash = getHashParameters().get("ID");
	if (fromHash) return parseInt(fromHash);

	const fromList = findElement(".options-list.lease, .options-list[data-id]", true)?.dataset.id;
	if (fromList) return parseInt(fromList);

	const fromForm = findElement<HTMLInputElement>("#market input[name='ID'], .property-option input[name='ID']", true)?.value;
	if (fromForm) return parseInt(fromForm);

	return null;
}

function getOwnedProperty(propertyId: number) {
	const properties = userdata.properties;
	if (!Array.isArray(properties)) return undefined;
	return properties.find((property) => property.id === propertyId);
}

function getPropertyTypeFromDom(): { id: number; name: string; happy?: number } | undefined {
	const resolvedName = findElement(".property-info-cont .title-black, .property-option .title-black", true)?.textContent?.trim();
	if (!resolvedName) return undefined;

	const happyRow = findAllElements(".property-info-cont .info > li, .property-option .info > li").find(
		(row) => findElement(".title", row, true)?.textContent?.trim() === "Happiness",
	);
	const happyText = happyRow ? findElement(".desc", happyRow, true)?.textContent?.replaceAll(/[^\d]/g, "") : undefined;
	const happy = happyText ? parseInt(happyText, 10) : undefined;

	const tornProperties = torndata.properties;
	if (Array.isArray(tornProperties)) {
		const match = tornProperties.find((property) => property.name === resolvedName);
		if (match) return { id: match.id, name: match.name, happy: Number.isFinite(happy) ? happy : undefined };
	}

	return undefined;
}

function resolvePropertyContext(propertyId: number) {
	const owned = getOwnedProperty(propertyId);
	if (owned?.property.id) {
		return {
			typeId: owned.property.id,
			name: owned.property.name,
			happy: owned.happy,
		};
	}

	const fromDom = getPropertyTypeFromDom();
	if (fromDom) {
		return {
			typeId: fromDom.id,
			name: fromDom.name,
			happy: fromDom.happy,
		};
	}

	return undefined;
}

function parseDays(value: string): number | null {
	const days = parseInt(value.replaceAll(/[^\d]/g, ""), 10);
	if (!Number.isFinite(days) || days < 1) return null;
	return days;
}

async function refreshRecommendation() {
	const requestId = ++activeRequestId;
	const daysInput = getDaysInput();
	if (!daysInput) {
		removePanel();
		return;
	}

	const days = parseDays(daysInput.value);
	if (days == null) {
		renderPanel({ state: "message", text: "Enter a valid number of days to see market prices." });
		return;
	}

	const propertyId = getPropertyId();
	if (propertyId == null) {
		log("Could not resolve property ID from hash/DOM.");
		renderPanel({ state: "message", text: "Could not determine which property is being leased." });
		return;
	}

	const context = resolvePropertyContext(propertyId);
	if (!context) {
		log("Could not resolve property type context.", { propertyId, hasUserProperties: Array.isArray(userdata.properties) });
		renderPanel({ state: "message", text: "Property data is not available yet." });
		return;
	}

	renderPanel({ state: "loading" });

	try {
		const listings = await fetchRentalListings(context.typeId);
		if (requestId !== activeRequestId) return;

		const periodStats = computeLeasePriceStats(listings, days, context.happy);
		const dailyStats = computeDailyRateStats(listings, context.happy);

		if (!periodStats && !dailyStats) {
			renderPanel({
				state: "message",
				text: `No rental market listings found for ${context.name}.`,
			});
			return;
		}

		renderPanel({ state: "stats", periodStats, dailyStats, days });
	} catch (error) {
		if (requestId !== activeRequestId) return;
		console.error(LOG_PREFIX, "Failed to load lease market prices.", error);
		renderPanel({ state: "message", text: "Failed to load rental market prices." });
	}
}

async function fetchRentalListings(propertyTypeId: number) {
	const cacheKey = String(propertyTypeId);
	if (ttCache.hasValue(CACHE_SECTION, cacheKey)) {
		const cached = ttCache.get<MarketRentalsResponse["rentals"]["listings"]>(CACHE_SECTION, cacheKey);
		if (cached) return cached;
	}

	const listings: MarketRentalsResponse["rentals"]["listings"] = [];
	let offset = 0;

	for (let page = 0; page < MAX_PAGES; page++) {
		const response = await fetchData<MarketRentalsResponse>("tornv2", {
			section: "market",
			id: propertyTypeId,
			selections: ["rentals"],
			params: { limit: FETCH_LIMIT, offset },
			relay: true,
			silent: true,
		});

		const pageListings = response.rentals?.listings ?? [];
		listings.push(...pageListings);

		const total = response._metadata?.total;
		const hasMore = response._metadata?.links?.next != null || (total != null && offset + pageListings.length < total);

		if (pageListings.length < FETCH_LIMIT || !hasMore) {
			break;
		}

		offset += pageListings.length;
	}

	ttCache.set({ [cacheKey]: listings }, CACHE_TTL, CACHE_SECTION);
	return listings;
}

type PanelContent =
	| { state: "loading" }
	| { state: "message"; text: string }
	| { state: "stats"; periodStats: LeasePriceStats | null; dailyStats: DailyRateStats | null; days: number };

function renderPanel(content: PanelContent) {
	const anchor = findElement(".property-option", true) ?? findElement(".lease-opt", true);
	if (!anchor) {
		log("Cannot render panel — no `.property-option` / `.lease-opt` anchor.");
		removePanel();
		return;
	}

	const { content: containerContent } = createContainer(CONTAINER_TITLE, {
		previousElement: anchor,
		spacer: true,
		class: "tt-lease-price-recommendation",
	});

	const children: Node[] = [];

	if (content.state === "loading") {
		children.push(elementBuilder({ type: "div", class: "tt-lease-price-message", text: "Loading comparable listings…" }));
	} else if (content.state === "message") {
		children.push(elementBuilder({ type: "div", class: "tt-lease-price-message", text: content.text }));
	} else {
		const { periodStats, dailyStats, days } = content;

		if (periodStats) {
			children.push(buildPeriodSection(periodStats, days));
		} else {
			children.push(
				elementBuilder({
					type: "div",
					class: "tt-lease-price-section",
					children: [
						elementBuilder({ type: "div", class: "tt-lease-price-section-title", text: `Same period (${days} days)` }),
						elementBuilder({
							type: "div",
							class: "tt-lease-price-message",
							text: `No listings found for exactly ${days} days.`,
						}),
					],
				}),
			);
		}

		if (dailyStats) {
			children.push(buildDailySection(dailyStats, days));
		}
	}

	containerContent.replaceChildren(...children);
}

function buildPeriodSection(stats: LeasePriceStats, days: number) {
	const happyNote = stats.usedHappyFilter ? " (similar happiness)" : "";

	return elementBuilder({
		type: "div",
		class: "tt-lease-price-section",
		children: [
			elementBuilder({ type: "div", class: "tt-lease-price-section-title", text: `Same period (${days} days)` }),
			buildStatRow("Min total", formatNumber(stats.min, { currency: true })),
			buildStatRow("Max total", formatNumber(stats.max, { currency: true })),
			buildStatRow("Recommended total", formatNumber(stats.recommended, { currency: true }), true),
			elementBuilder({
				type: "div",
				class: "tt-lease-price-meta",
				text: `Based on ${stats.matchCount} listing${stats.matchCount === 1 ? "" : "s"} for ${days} days${happyNote}.`,
			}),
			buildApplyButton("Apply same-period price", () => applyRecommended(stats.recommended)),
		],
	});
}

function buildDailySection(stats: DailyRateStats, days: number) {
	const happyNote = stats.usedHappyFilter ? " (similar happiness)" : "";
	const total = stats.recommendedPerDay * days;

	return elementBuilder({
		type: "div",
		class: "tt-lease-price-section",
		children: [
			elementBuilder({ type: "div", class: "tt-lease-price-section-title", text: "Daily rate (all listings)" }),
			buildStatRow("Min / day", `${formatNumber(stats.minPerDay, { currency: true })} / day`),
			buildStatRow("Max / day", `${formatNumber(stats.maxPerDay, { currency: true })} / day`),
			buildStatRow("Recommended / day", `${formatNumber(stats.recommendedPerDay, { currency: true })} / day`, true),
			buildStatRow(`For ${days} days`, formatNumber(total, { currency: true }), true),
			elementBuilder({
				type: "div",
				class: "tt-lease-price-meta",
				text: `Based on ${stats.matchCount} listing${stats.matchCount === 1 ? "" : "s"} across all durations${happyNote}.`,
			}),
			buildApplyButton("Apply daily-rate total", () => applyRecommended(total)),
		],
	});
}

function buildApplyButton(label: string, onClick: () => void) {
	return elementBuilder({
		type: "span",
		class: "btn tt-lease-price-apply",
		children: [
			elementBuilder({
				type: "input",
				class: "torn-btn",
				value: label,
				attributes: { type: "button" },
				events: {
					click: (event) => {
						event.preventDefault();
						event.stopPropagation();
						onClick();
					},
				},
			}),
		],
	});
}

function buildStatRow(label: string, value: string, recommended = false) {
	return elementBuilder({
		type: "div",
		class: recommended ? "tt-lease-price-row recommended" : "tt-lease-price-row",
		children: [
			elementBuilder({ type: "span", class: "tt-lease-price-label", text: label }),
			elementBuilder({ type: "span", class: "tt-lease-price-value", text: value }),
		],
	});
}

function applyRecommended(amount: number) {
	const costInput = getCostInput();
	if (!costInput) {
		log("Could not find the lease cost input to apply the recommended price.");
		return;
	}

	updateReactInput(costInput, amount.toString());

	const hiddenCost = findElement<HTMLInputElement>("#market input[data-name='money'][type='hidden']", true);
	if (hiddenCost && hiddenCost !== costInput) {
		updateReactInput(hiddenCost, amount.toString());
	}
}

function removePanel() {
	removeContainer(CONTAINER_TITLE);
}

function teardown() {
	marketObserver?.disconnect();
	marketObserver = null;
	removePanel();
}

function isLeaseRoute() {
	const params = getHashParameters();
	return params.get("p") === "options" && params.get("tab") === "lease";
}

export default class LeasePriceRecommendationFeature extends Feature {
	constructor() {
		super("Lease Price Recommendation", "properties");
	}

	override precondition() {
		return getPageStatus().access;
	}

	override requirements() {
		if (!hasAPIData()) return "No API access.";
		if (!settings.apiUsage.user.properties) return "User properties is disabled.";
		return true;
	}

	override isEnabled() {
		return settings.pages.property.leasePriceRecommendation;
	}

	override initialise() {
		initialiseListeners();
	}

	override async execute() {
		if (!isLeaseRoute()) return;

		await startFeature();
	}

	override async reload() {
		if (!isLeaseRoute()) {
			teardown();
			return;
		}

		await startFeature();
	}

	override storageKeys() {
		return [
			"settings.pages.property.leasePriceRecommendation",
			"settings.apiUsage.user.properties",
			"userdata.properties",
		];
	}
}

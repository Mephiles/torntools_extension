import "./lease-price-recommendation.css";
import { ttCache } from "@common/utils/data/cache";
import { settings, torndata, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { elementBuilder, getHashParameters } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { formatNumber } from "@common/utils/functions/formatting";
import { requireCondition, requireElement } from "@common/utils/functions/requires";
import { getPageStatus, updateReactInput } from "@common/utils/functions/torn";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import { Feature } from "@features/feature";
import { computeDailyRateStats, computeLeasePriceStats, totalFromDailyRate } from "@features/lease-price-recommendation/lease-price-stats";
import type { DailyRateStats, LeasePriceStats } from "@features/lease-price-recommendation/lease-price-stats";
import type { MarketRentalsResponse } from "tornapi-typescript";

const PANEL_ID = "tt-lease-price-recommendation";
const CACHE_SECTION = "propertyRentals";
const CACHE_TTL = TO_MILLIS.MINUTES * 5;
const FETCH_LIMIT = 100;
const MAX_PAGES = 5;
const DAYS_DEBOUNCE_MS = 300;

let daysDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let activeRequestId = 0;

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.PROPERTIES__ROUTE, async ({ route: { page, paramTab } }) => {
		if (page !== "options" || paramTab !== "lease") {
			removePanel();
			return;
		}

		await startFeature();
	});
	addCustomListener(EVENT_CHANNELS.PROPERTIES__ROUTE_PAGE, async ({ route: { page, paramTab } }) => {
		if (page !== "options" || paramTab !== "lease") {
			removePanel();
			return;
		}

		await startFeature();
	});
}

async function startFeature() {
	await requireElement(".lease-opt");
	await requireElement("#tab-menu-lease");

	bindTabListeners();

	if (!isMarketPanelVisible()) {
		removePanel();
		return;
	}

	await requireElement("#market .lease-input");
	bindDaysListener();
	// Days are pre-filled (default 7) — recommend immediately without waiting for input.
	await refreshRecommendation();
}

function bindTabListeners() {
	const tabMenu = findElement("#tab-menu-lease", true);
	if (!tabMenu || tabMenu.dataset.ttLeasePriceBound === "true") return;

	tabMenu.dataset.ttLeasePriceBound = "true";
	tabMenu.addEventListener("click", (event) => {
		const target = event.target;
		if (!(target instanceof Element)) return;

		if (target.closest("#leasemarket, #market1")) {
			void showWhenMarketReady();
			return;
		}

		if (target.closest("#leaseperson, #user1")) {
			removePanel();
		}
	});
}

async function showWhenMarketReady() {
	try {
		await requireCondition(() => isMarketPanelVisible(), { delay: 50, maxCycles: 40 });
		await startFeature();
	} catch (error) {
		console.debug("TT - Lease market tab did not become ready in time.", error);
	}
}

function isMarketPanelVisible() {
	const marketPanel = findElement("#market", true);
	if (!marketPanel) return false;

	if (marketPanel.getAttribute("aria-hidden") === "true") return false;
	if (marketPanel.getAttribute("aria-expanded") === "false") return false;

	const style = window.getComputedStyle(marketPanel);
	if (style.display === "none" || style.visibility === "hidden") return false;

	return true;
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
	return findElement<HTMLInputElement>("#market input.lease.input-money[data-name='days']:not([type='hidden'])", true);
}

function getCostInput() {
	return findElement<HTMLInputElement>("#market input.lease.input-money[data-name='money']:not([type='hidden'])", true);
}

function getPropertyId() {
	const fromHash = getHashParameters().get("ID");
	if (fromHash) return parseInt(fromHash);

	const fromList = findElement(".options-list.lease", true)?.dataset.id;
	if (fromList) return parseInt(fromList);

	const fromForm = findElement<HTMLInputElement>("#market input[name='ID']", true)?.value;
	if (fromForm) return parseInt(fromForm);

	return NaN;
}

function getOwnedProperty(propertyId: number) {
	const properties = userdata.properties;
	if (!Array.isArray(properties)) return undefined;
	return properties.find((property) => property.id === propertyId);
}

function getPropertyTypeFromDom(): { id: number; name: string; happy?: number } | undefined {
	const resolvedName = findElement(".property-info-cont .title-black", true)?.textContent?.trim();
	if (!resolvedName) return undefined;

	const happyRow = findAllElements(".property-info-cont .info > li").find((row) => findElement(".title", row, true)?.textContent?.trim() === "Happiness");
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

	if (!hasAPIData()) {
		renderPanel({ state: "message", text: "No API access. Add an API key in TornTools to load market prices." });
		return;
	}

	const days = parseDays(daysInput.value);
	if (days == null) {
		renderPanel({ state: "message", text: "Enter a valid number of days to see market prices." });
		return;
	}

	const propertyId = getPropertyId();
	if (!Number.isFinite(propertyId)) {
		renderPanel({ state: "message", text: "Could not determine which property is being leased." });
		return;
	}

	const context = resolvePropertyContext(propertyId);
	if (!context) {
		renderPanel({
			state: "message",
			text: "Property data is not available yet. Wait for the API update or enable user properties.",
		});
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
		console.error("TT - Failed to load lease market prices.", error);
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
	removePanel();

	const marketForm = findElement("#market form", true);
	const leaseInput = findElement("#market .lease-input", true);
	const anchor = marketForm ?? leaseInput;
	if (!anchor) return;

	const children: (string | Node)[] = [elementBuilder({ type: "div", class: "tt-lease-price-title", text: "Market prices" })];

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

	const panel = elementBuilder({
		type: "div",
		id: PANEL_ID,
		class: "tt-lease-price-recommendation",
		children,
	});

	// Keep the panel outside Torn's lease <form> so Apply is not treated as submit / disabled with NEXT.
	if (marketForm) {
		marketForm.insertAdjacentElement("afterend", panel);
	} else {
		anchor.insertAdjacentElement("afterend", panel);
	}
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
	const total = totalFromDailyRate(stats.recommendedPerDay, days);

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
		console.warn("TT - Could not find the lease cost input to apply the recommended price.");
		return;
	}

	updateReactInput(costInput, amount.toString());

	// Keep Torn's paired hidden money field in sync when present.
	const hiddenCost = findElement<HTMLInputElement>("#market input.lease.input-money[data-name='money'][type='hidden']", true);
	if (hiddenCost && hiddenCost !== costInput) {
		updateReactInput(hiddenCost, amount.toString());
	}
}

function removePanel() {
	findElement(`#${PANEL_ID}`, true)?.remove();
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
			removePanel();
			return;
		}

		await startFeature();
	}

	override storageKeys() {
		// Restart when property/torndata arrives so the first open after install still works.
		return ["settings.pages.property.leasePriceRecommendation", "userdata.properties", "torndata.properties"];
	}
}

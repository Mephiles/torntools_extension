import "./lease-price-recommendation.css";
import { ttCache } from "@common/utils/data/cache";
import { settings, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { createContainer, removeContainer } from "@common/utils/functions/containers";
import { elementBuilder, getHashParameters } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { findElement } from "@common/utils/functions/find-elements";
import { formatNumber } from "@common/utils/functions/formatting";
import { requireCondition, requireElement } from "@common/utils/functions/requires";
import { getPageStatus, REACT_UPDATE_VERSIONS, updateReactInput } from "@common/utils/functions/torn";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import { Feature } from "@features/feature";
import type { DailyRateStats, LeasePriceStats } from "@features/lease-price-recommendation/lease-price-stats";
import { computeDailyRateStats, computeLeasePriceStats } from "@features/lease-price-recommendation/lease-price-stats";
import type { MarketRentalsResponse } from "tornapi-typescript";

const CONTAINER_TITLE = "Market Prices";
const CACHE_SECTION = "propertyRentals";
const CACHE_TTL = TO_MILLIS.MINUTES * 5;
const FETCH_LIMIT = 100;
const MAX_PAGES = 5;
const DAYS_DEBOUNCE_MS = 300;

type LeaseFormKind = "market" | "extension";

let daysDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let activeRequestId = 0;
let activeForm: LeaseFormKind | null = null;

function initialiseListeners() {
	addCustomListener(EVENT_CHANNELS.PROPERTIES__ROUTE, async ({ route: { page, paramTab } }) => {
		if (page !== "options" || !isSupportedTab(paramTab)) {
			removePanel();
			return;
		}

		await startFeature();
	});
	addCustomListener(EVENT_CHANNELS.PROPERTIES__ROUTE_PAGE, async ({ route: { page, paramTab } }) => {
		if (page !== "options" || !isSupportedTab(paramTab)) {
			removePanel();
			return;
		}

		await startFeature();
	});
}

function isSupportedTab(tab: string | null) {
	return tab === "lease" || tab === "offerExtension";
}

async function startFeature() {
	const tab = getHashParameters().get("tab");

	if (tab === "offerExtension") {
		await startExtensionForm();
		return;
	}

	if (tab !== "lease") {
		removePanel();
		return;
	}

	await startMarketForm();
}

async function startExtensionForm() {
	activeForm = "extension";

	await requireElement(".offerExtension-form");
	await requireElement(".offerExtension.input-money[data-name='days']:not([type='hidden'])");

	bindDaysListener();
	await refreshRecommendation();
}

async function startMarketForm() {
	activeForm = "market";

	await requireElement(".lease-opt");
	await requireElement("#tab-menu-lease");

	bindTabListeners();

	if (!isMarketPanelVisible()) {
		removePanel();
		return;
	}

	await requireElement("#market .lease-input");
	bindDaysListener();
	await refreshRecommendation();
}

function bindTabListeners() {
	const tabMenu = findElement("#tab-menu-lease");
	if (tabMenu.dataset.ttLeasePriceBound === "true") return;

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
	await requireCondition(() => isMarketPanelVisible(), { delay: 50, maxCycles: 40 });
	await startMarketForm();
}

function isMarketPanelVisible() {
	const marketPanel = findElement("#market", true);
	return !!marketPanel?.checkVisibility();
}

function bindDaysListener() {
	const daysInput = getDaysInput();
	if (daysInput.dataset.ttLeasePriceBound === "true") return;

	daysInput.dataset.ttLeasePriceBound = "true";
	daysInput.addEventListener("input", () => {
		if (daysDebounceTimer) clearTimeout(daysDebounceTimer);
		daysDebounceTimer = setTimeout(() => {
			void refreshRecommendation();
		}, DAYS_DEBOUNCE_MS);
	});
}

function getDaysInput() {
	if (activeForm === "extension") {
		return findElement<HTMLInputElement>(".offerExtension.input-money[data-name='days']:not([type='hidden'])");
	}

	return findElement<HTMLInputElement>("#market input.lease.input-money[data-name='days']:not([type='hidden'])");
}

function getCostInput() {
	if (activeForm === "extension") {
		return findElement<HTMLInputElement>(".offerExtension.input-money[data-name='offercost']:not([type='hidden'])");
	}

	return findElement<HTMLInputElement>("#market input.lease.input-money[data-name='money']:not([type='hidden'])");
}

function getPropertyId(): number | null {
	const fromHash = getHashParameters().get("ID");
	if (fromHash) return parseInt(fromHash);

	const fromList = findElement(".options-list.lease", true)?.dataset.id;
	if (fromList) return parseInt(fromList);

	const fromForm = findElement<HTMLInputElement>("#market input[name='ID'], .offerExtension-form input[name='ID']", true)?.value;
	if (fromForm) return parseInt(fromForm);

	return null;
}

function resolvePropertyContext(propertyId: number) {
	const owned = userdata.properties.find((property) => property.id === propertyId);
	if (!owned?.property.id) return null;

	return {
		typeId: owned.property.id,
		name: owned.property.name,
		happy: owned.happy,
	};
}

function parseDays(value: string): number | null {
	const days = parseInt(value.replaceAll(/[^\d]/g, ""), 10);
	if (!Number.isFinite(days) || days < 1) return null;
	return days;
}

async function refreshRecommendation() {
	const requestId = ++activeRequestId;
	const daysInput = getDaysInput();

	const days = parseDays(daysInput.value);
	if (days == null) {
		renderPanel({ state: "message", text: "Enter a valid number of days to see market prices." });
		return;
	}

	const propertyId = getPropertyId();
	if (propertyId == null) {
		throw new Error("Could not determine which property is being leased.");
	}

	const context = resolvePropertyContext(propertyId);
	if (!context) {
		throw new Error(`Property ${propertyId} was not found in userdata.properties.`);
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
		throw error;
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
	const anchor = activeForm === "extension" ? findElement(".property-option, .offerExtension-form") : findElement(".property-option, .lease-opt");

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
	updateReactInput(costInput, amount.toString(), { version: REACT_UPDATE_VERSIONS.DOUBLE_DEFAULT });

	if (activeForm === "market") {
		const hiddenCost = findElement<HTMLInputElement>("#market input.lease.input-money[data-name='money'][type='hidden']", true);
		if (hiddenCost && hiddenCost !== costInput) {
			updateReactInput(hiddenCost, amount.toString());
		}
	}
}

function removePanel() {
	removeContainer(CONTAINER_TITLE);
}

function isSupportedRoute() {
	const params = getHashParameters();
	return params.get("p") === "options" && isSupportedTab(params.get("tab"));
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
		if (!isSupportedRoute()) return;

		await startFeature();
	}

	override async reload() {
		if (!isSupportedRoute()) {
			removePanel();
			return;
		}

		await startFeature();
	}

	override storageKeys() {
		return ["settings.pages.property.leasePriceRecommendation", "settings.apiUsage.user.properties", "userdata.properties"];
	}
}

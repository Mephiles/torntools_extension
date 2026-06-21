import type { InternalCityItem, TornCityMapRuntime, TornCityObject } from "@common/pages/city-page";

export const CITY_ITEMS_MAP_EVENTS = {
	SET_ITEMS: "tt-city-items:set-items",
	REQUEST_MODEL_ITEMS: "tt-city-items:request-model-items",
	MODEL_ITEMS: "tt-city-items:model-items",
	CLEAR: "tt-city-items:clear",
} as const;

export interface CityItemsMapEntry {
	entryId: string;
	itemId: number;
	name: string;
	td: string;
	x: number;
	y: number;
}

interface LeafletLatLng {
	lat: number;
	lng: number;
}

type LeafletLatLngLike = LeafletLatLng | [number, number];

type LeafletPoint = unknown;

interface LeafletMap {
	addLayer(layer: LeafletMarker): unknown;
	removeLayer?(layer: LeafletMarker): void;
}

type LeafletIcon = object;

interface LeafletMarker {
	_map?: LeafletMap;
	setLatLng?(latLng: LeafletLatLngLike): this;
	addTo?(map: LeafletMap): this;
	remove?(): this;
	removeFrom?(map: LeafletMap | null): this;
	getElement?(): HTMLElement | null;
}

interface LeafletDivIconOptions {
	className: string;
	html: string;
	iconSize: [number, number];
	iconAnchor: [number, number];
}

interface LeafletMarkerOptions {
	icon: LeafletIcon;
	interactive: boolean;
	keyboard: boolean;
	zIndexOffset: number;
}

interface LeafletRuntime {
	divIcon?(options: LeafletDivIconOptions): LeafletIcon;
	marker?(latLng: LeafletLatLngLike, options: LeafletMarkerOptions): LeafletMarker;
	CRS?: {
		EPSG3857?: {
			pointToLatLng(point: LeafletPoint, zoom?: number): LeafletLatLngLike;
		};
	};
}

interface LeafletOverlayRuntime extends LeafletRuntime {
	divIcon(options: LeafletDivIconOptions): LeafletIcon;
	marker(latLng: LeafletLatLngLike, options: LeafletMarkerOptions): LeafletMarker;
}

interface TornMapRuntime extends TornCityMapRuntime {
	lmap?: LeafletMap;
	getLPoint?(point: [number, number]): LeafletPoint;
}

type TornRuntime = Partial<Pick<TornCityObject, "model">> & {
	map?: TornMapRuntime;
};

interface CityItemsMapWindow extends Window {
	L?: LeafletRuntime;
	__ttCityItemsMap?: CityItemsMapState;
}

interface LeafletMapElement extends HTMLElement {
	_leaflet_map?: LeafletMap;
}

interface OverlayRecord {
	entry: CityItemsMapEntry;
	marker: LeafletMarker | null;
	latLng?: LeafletLatLngLike;
}

interface CityItemsMapState {
	injected: boolean;
	entries: CityItemsMapEntry[];
	overlays: Map<string, OverlayRecord>;
	syncTimer?: number;
}

const BASE_HIGHLIGHT_SIZE = 38;
const SYNC_ATTEMPT_INTERVAL = 250;
const SYNC_ATTEMPT_LIMIT = 80;

export function injectCityItemsMapListeners(pageWindow: CityItemsMapWindow = window) {
	if (pageWindow.__ttCityItemsMap?.injected) return;

	const state: CityItemsMapState = {
		injected: true,
		entries: [],
		overlays: new Map(),
	};
	pageWindow.__ttCityItemsMap = state;

	pageWindow.addEventListener(CITY_ITEMS_MAP_EVENTS.SET_ITEMS, handleSetItemsEvent);
	pageWindow.addEventListener(CITY_ITEMS_MAP_EVENTS.REQUEST_MODEL_ITEMS, () => {
		const items = getModelItems();
		dispatchPageEvent(CITY_ITEMS_MAP_EVENTS.MODEL_ITEMS, { items });
	});
	pageWindow.addEventListener(CITY_ITEMS_MAP_EVENTS.CLEAR, clearOverlays);

	function handleSetItemsEvent(event: Event) {
		const detail = parseEventDetail<{ entries?: unknown }>(event);
		if (!detail) return;

		state.entries = Array.isArray(detail.entries) ? detail.entries.filter(isCityItemsMapEntry) : [];
		scheduleSync();
	}

	function scheduleSync() {
		let attempts = 0;
		syncOverlays();
		if (state.syncTimer) return;

		state.syncTimer = pageWindow.setInterval(() => {
			attempts++;
			const synced = syncOverlays();
			if (synced || attempts >= SYNC_ATTEMPT_LIMIT || !state.entries.length) {
				if (state.syncTimer) pageWindow.clearInterval(state.syncTimer);
				state.syncTimer = undefined;
			}
		}, SYNC_ATTEMPT_INTERVAL);
	}

	function syncOverlays(): boolean {
		const map = getMap();
		const leaflet = pageWindow.L;
		if (!map || !isLeafletOverlayRuntime(leaflet)) return false;

		const activeEntryIds = new Set(state.entries.map((entry) => entry.entryId));

		for (const [entryId, record] of state.overlays) {
			if (!activeEntryIds.has(entryId)) {
				removeOverlay(record);
				state.overlays.delete(entryId);
			}
		}

		for (const entry of state.entries) {
			let record = state.overlays.get(entry.entryId);
			const latLng = getLatLngForEntry(entry);
			if (!latLng) continue;

			if (!record) {
				record = { entry, marker: null, latLng };
				state.overlays.set(entry.entryId, record);
			} else {
				record.entry = entry;
				record.latLng = latLng;
			}

			ensureOverlay(record, map, leaflet);
		}

		return state.entries.every((entry) => !!state.overlays.get(entry.entryId)?.marker);
	}

	function ensureOverlay(record: OverlayRecord, map: LeafletMap, leaflet: LeafletOverlayRuntime) {
		const latLng = record.latLng;
		if (!latLng) return;

		try {
			if (record.marker?._map && record.marker._map !== map) removeOverlay(record);

			if (record.marker) {
				record.marker.setLatLng?.(latLng);
				updateOverlayElement(record);
				return;
			}

			const icon = leaflet.divIcon({
				className: "tt-city-item-overlay city-item",
				html: `<span class="tt-city-item-overlay-content"><img src="${getItemImageUrl(record.entry.itemId)}" alt=""></span>`,
				iconSize: [BASE_HIGHLIGHT_SIZE, BASE_HIGHLIGHT_SIZE],
				iconAnchor: [BASE_HIGHLIGHT_SIZE / 2, BASE_HIGHLIGHT_SIZE / 2],
			});

			const marker = leaflet.marker(latLng, {
				icon,
				interactive: true,
				keyboard: false,
				zIndexOffset: 1000,
			});
			if (typeof marker.addTo !== "function") return;

			marker.addTo(map);
			record.marker = marker;
			updateOverlayElement(record);
		} catch {
			record.marker = null;
		}
	}

	function updateOverlayElement(record: OverlayRecord) {
		const element = record.marker?.getElement?.();
		if (!element) return;

		element.classList.add("tt-city-item-overlay", "city-item");
		element.dataset.id = record.entry.itemId.toString();
		element.dataset.itemId = record.entry.itemId.toString();
		element.dataset.entryId = record.entry.entryId;
		element.dataset.td = record.entry.td;
		element.removeAttribute("title");
	}

	function clearOverlays() {
		state.entries = [];
		if (state.syncTimer) {
			pageWindow.clearInterval(state.syncTimer);
			state.syncTimer = undefined;
		}
		for (const record of state.overlays.values()) removeOverlay(record);
		state.overlays.clear();
	}

	function removeOverlay(record: OverlayRecord) {
		if (!record.marker) return;

		try {
			if (record.marker.remove) record.marker.remove();
			else record.marker.removeFrom?.(getMap());
		} catch {
			try {
				record.marker._map?.removeLayer?.(record.marker);
			} catch {}
		}
		record.marker = null;
	}

	function getMap(): LeafletMap | null {
		const mapElement = pageWindow.document.querySelector<LeafletMapElement>("#map");
		const map = getTornRuntime()?.map?.lmap ?? mapElement?._leaflet_map;
		return isLeafletMap(map) ? map : null;
	}

	function getLatLngForEntry(entry: CityItemsMapEntry): LeafletLatLngLike | null {
		if (!Number.isFinite(entry.x) || !Number.isFinite(entry.y)) return null;

		const tornMap = getTornRuntime()?.map;
		const leaflet = pageWindow.L;
		try {
			if (tornMap?.getLPoint && leaflet?.CRS?.EPSG3857?.pointToLatLng) {
				const point: [number, number] = [entry.x / 2, entry.y / 2];
				const leafletPoint = tornMap.getLPoint(point);
				return normalizeLatLng(leaflet.CRS.EPSG3857.pointToLatLng(leafletPoint, tornMap.minZoom));
			}
		} catch {}

		return null;
	}

	function getModelItems(): InternalCityItem[] {
		const model = getTornRuntime()?.model;
		if (!model) return [];

		try {
			const fullModel = model.get();
			if (Array.isArray(fullModel?.territoryUserItems)) return fullModel.territoryUserItems;
		} catch {}

		try {
			const userItems = model.get("territoryUserItems");
			if (Array.isArray(userItems)) return userItems;
		} catch {}

		return [];
	}

	function getTornRuntime(): TornRuntime | null {
		const torn: unknown = pageWindow.torn;
		return isTornRuntime(torn) ? torn : null;
	}

	function dispatchPageEvent(name: (typeof CITY_ITEMS_MAP_EVENTS)[keyof typeof CITY_ITEMS_MAP_EVENTS], detail?: unknown) {
		pageWindow.dispatchEvent(new CustomEvent(name, { detail: serializeEventDetail(detail) }));
	}
}

function parseEventDetail<T>(event: Event): T | null {
	if (!isCustomEvent<unknown>(event)) return null;

	if (typeof event.detail === "string") {
		try {
			return JSON.parse(event.detail) as T;
		} catch {
			return null;
		}
	}

	return event.detail as T;
}

function serializeEventDetail(detail: unknown): string | undefined {
	if (detail === undefined) return undefined;

	try {
		return JSON.stringify(detail);
	} catch {
		return undefined;
	}
}

function isCustomEvent<T>(event: Event): event is CustomEvent<T> {
	return "detail" in event;
}

function isCityItemsMapEntry(value: unknown): value is CityItemsMapEntry {
	return (
		isRecord(value) &&
		typeof value.entryId === "string" &&
		typeof value.itemId === "number" &&
		Number.isFinite(value.itemId) &&
		typeof value.name === "string" &&
		typeof value.td === "string" &&
		typeof value.x === "number" &&
		Number.isFinite(value.x) &&
		typeof value.y === "number" &&
		Number.isFinite(value.y)
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

function isTornRuntime(value: unknown): value is TornRuntime {
	return (
		isRecord(value) &&
		(!("map" in value) || value.map == null || isTornMapRuntime(value.map)) &&
		(!("model" in value) || value.model == null || isTornModelRuntime(value.model))
	);
}

function isTornMapRuntime(value: unknown): value is TornMapRuntime {
	return (
		isRecord(value) &&
		(!("lmap" in value) || value.lmap == null || isLeafletMap(value.lmap)) &&
		(!("minZoom" in value) || value.minZoom == null || typeof value.minZoom === "number") &&
		(!("getLPoint" in value) || value.getLPoint == null || typeof value.getLPoint === "function")
	);
}

function isTornModelRuntime(value: unknown): value is TornCityObject["model"] {
	return isRecord(value) && typeof value.get === "function";
}

function isLeafletMap(value: unknown): value is LeafletMap {
	return isRecord(value) && typeof value.addLayer === "function";
}

function isLeafletOverlayRuntime(value: unknown): value is LeafletOverlayRuntime {
	return isRecord(value) && typeof value.divIcon === "function" && typeof value.marker === "function";
}

function normalizeLatLng(latLng: LeafletLatLngLike | null | undefined): LeafletLatLngLike | null {
	if (!latLng) return null;

	if (Array.isArray(latLng)) {
		const [lat, lng] = latLng;
		return Number.isFinite(lat) && Number.isFinite(lng) ? latLng : null;
	}

	return Number.isFinite(latLng.lat) && Number.isFinite(latLng.lng) ? latLng : null;
}

function getItemImageUrl(itemId: number): string {
	return `https://www.torn.com/images/items/${itemId}/small.png`;
}

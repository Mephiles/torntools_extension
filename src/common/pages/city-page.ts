import type { XHRDetails } from "@common/utils/functions/script-injector";

declare global {
	interface Window {
		torn: TornCityObject;
	}
}

export interface TornCityObject {
	model: TornCityModel;
	map?: TornCityMapRuntime;
}

export interface TornCityModel {
	get(): Omit<MapData, "territoryUserItems"> & { territoryUserItems: InternalCityItem[] };
	get(key: "territoryUserItems"): InternalCityItem[];
}

export interface TornCityMapRuntime {
	lmap?: unknown;
	minZoom?: number;
	getLPoint?(point: [number, number]): unknown;
}

export type MapData = {
	mapConstants: {
		TERRITORY_RESPECT_PRICE: number;
		TERRITORY_PRICE_COEF: number;
		MOVE_ACTION_COST: number;
	};
	availableTerrQuantity: number;
	factionURL: string;
	isUserMode: boolean;
	factionOwnTerritories: {
		userID: number;
		factionID: number;
		isStaff: boolean;
		territories: Record<string, Record<string, number>>;
		neighbors: {
			[id: string]: number[] | number;
			count: number;
		};
		amount: Record<string, number>;
		factionData: Record<string, FactionData>;
		factionInWarData: Record<string, FactionData>;
		neighborsColor: string;
		isLeader: false;
		terrInWars: Record<
			string,
			{
				territoryID: number;
				attackFaction: number;
				defendFaction: number;
			}
		>;
		factionInWar: unknown[];
		factionWarTimeOuts: unknown[];
		lastAbandonTimeout: false;
		memberAmount: number;
		factionNAPs: unknown[];
		allTerr: unknown;
		colours: {
			ID: number;
			colour: string;
		}[];
	};
	currentTimeStamp: number;
	isTerritoryFactionAvailable: true;
	sectorMaxValue: number;
	availableSectors: number[];
	rackets: {
		type: number;
		territoryID: number;
		level: number;
		name: string;
		description: string;
		typeName: string;
	}[];
	dirtyBombs: Record<
		string,
		{
			faction: {
				factionID: number;
				name: string;
			};
		}
	>;
	cityLockDown: boolean;
	mapTutorialTemplate: string;
	smo_length: number;
	standardMapObjects: {
		id: number;
		html: string;
		title: string;
		link: string;
		marker_type: string;
		propertyID: number;
		gymID: number;
		place_id: number;
		map_object_id: number;
		map_territory_id: number;
		center_x: number;
		center_y: number;
		popularity: number;
		highlightClass: string;
		sortProps: {
			type: number;
			name: string;
			popularity: number;
		};
	}[];
	standardMapObjectsDisabled: unknown[];
	territoryUserItems: string;
};

export interface FactionData {
	image: string;
	colour: string;
	colourID: number;
	name: string;
	memberAmount: number;
	factionID: number;
	imageID: number;
	terr_component: number;
}

export function isMapData(page: string, xhr: XHRDetails["xhr"], _json: any): _json is MapData {
	return page === "city" && new URLSearchParams(xhr.responseURL).get("step") === "mapData";
}

export interface DecodedCityItem {
	id: string;
	d: string;
	c: { x: string; y: string };
	ts: string;
	title: string;
	size: { w: number; h: number };
	item_size: { w: number; h: number };
	article: string;
}

export interface InternalCityItem {
	article: string;
	coordinates: number[];
	item_id: number;
	item_size: { w: number; h: number };
	row_id: number;
	size: { w: number; h: number };
	timestamp: number;
	title: string;
}

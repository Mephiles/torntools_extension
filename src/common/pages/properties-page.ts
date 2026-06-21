import { getHashParameters } from "@common/utils/functions/dom";
import { EVENT_CHANNELS, triggerCustomListener } from "@common/utils/functions/listeners";
import { requireElement } from "@common/utils/functions/requires";

export type TornInternalSellPropertySuccess = { link: string; success: boolean; text: string };
export type TornInternalSellProperty =
	| {
			success: false;
			text: string;
	  }
	| TornInternalSellPropertySuccess;

export async function setupPropertiesPage() {
	let route = decidePropertiesRoute();

	requireElement("#properties-page-wrap").then((wrapper) => {
		requireElement(".ajax-preloader", { invert: true, parent: wrapper }).then(() => {
			triggerCustomListener(EVENT_CHANNELS.PROPERTIES__ROUTE, { route: route });
		});

		window.addEventListener("hashchange", async () => {
			const oldRoute = route;
			const newRoute = decidePropertiesRoute();
			if (!hasRouteChanged(oldRoute, newRoute)) {
				return;
			}

			route = newRoute;
			await requireElement(ROUTE_ROOT_MAP[newRoute.page]);
			await requireElement(".ajax-preloader", { invert: true, parent: wrapper });

			if (oldRoute.page !== newRoute.page) {
				triggerCustomListener(EVENT_CHANNELS.PROPERTIES__ROUTE, { route: newRoute });
			} else if (oldRoute.paramStart !== newRoute.paramStart || oldRoute.paramTab !== newRoute.paramTab) {
				triggerCustomListener(EVENT_CHANNELS.PROPERTIES__ROUTE_PAGE, { route: newRoute });
			}
		});
	});
}

type PropertiesPage = "all-properties" | "your-properties" | "spouse-properties" | "options";

export interface PropertiesRoute {
	page: PropertiesPage;
	paramStart: number | null;
	paramTab: string | null;
}

function decidePropertiesRoute(): PropertiesRoute {
	let page: PropertiesPage;
	let paramStart: number | null = null;
	let paramTab: string | null = null;

	const params = getHashParameters();

	const step = params.get("p");
	if (!step || step === "properties") {
		page = "all-properties";
		paramStart = params.has("start") ? parseInt(params.get("start")) : null;
	} else if (step === "yourProperties") {
		page = "your-properties";
		paramStart = params.has("start") ? parseInt(params.get("start")) : null;
	} else if (step === "spousesProperties") {
		page = "spouse-properties";
		paramStart = params.has("start") ? parseInt(params.get("start")) : null;
	} else if (step === "options") {
		page = "options";
		paramTab = params.get("tab");
	} else throw new Error(`Unknown properties route: ${step}`);

	return { page, paramStart, paramTab };
}

function hasRouteChanged(oldRoute: PropertiesRoute, newRoute: PropertiesRoute) {
	return oldRoute.page !== newRoute.page || oldRoute.paramStart !== newRoute.paramStart || oldRoute.paramTab !== newRoute.paramTab;
}

const ROUTE_ROOT_MAP: Record<PropertiesPage, string> = {
	"all-properties": ".properties-list",
	"your-properties": ".properties-list",
	"spouse-properties": ".properties-list",
	options: ".property-option",
};

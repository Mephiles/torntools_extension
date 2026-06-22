import type { TornInternalSellProperty } from "@common/pages/properties-page";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { displayAlert } from "@common/utils/functions/alerts";
import { fetchData } from "@common/utils/functions/api-fetcher";
import { findAllElements, getHashParameters } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/listeners";
import { Feature } from "@features/feature";

function initialise() {
	addCustomListener(EVENT_CHANNELS.PROPERTIES__ROUTE, async ({ route: { page, paramTab } }) => {
		if (!FEATURE_MANAGER.isEnabled(NoConfirmPropertiesFeature) || page !== "options" || paramTab !== "sell") return;

		await startFeature();
	});
	addCustomListener(EVENT_CHANNELS.PROPERTIES__ROUTE_PAGE, async ({ route: { page, paramTab } }) => {
		if (!FEATURE_MANAGER.isEnabled(NoConfirmPropertiesFeature) || page !== "options" || paramTab !== "sell") return;

		await startFeature();
	});
}

async function startFeature() {
	const sellButton = document.querySelector<HTMLElement>(".btn:has(input[type='submit'][value='SELL'][data-to='agent'])");
	if (!sellButton) return;

	sellButton.addEventListener("click", async (event) => {
		if (!FEATURE_MANAGER.isEnabled(NoConfirmPropertiesFeature)) return;
		event.preventDefault();
		event.stopPropagation();

		const propertyId = parseInt(getHashParameters().get("ID"));

		await sellProperty(propertyId)
			.then((result) => {
				if (!result.success) {
					console.warn("Failed to sell your property in a single click.", result);
					displayAlert({ type: "error", title: "Property Sell", text: result.text });
					return;
				}

				const actionWrapper = sellButton.closest(".agent.cont .wrap");
				if (!actionWrapper) return;

				actionWrapper.innerHTML = `
					${result.text} 
					<span class="btn-wrap silver">
						<a class="btn" href="${result.link}">
 							<span class="torn-btn">BACK</span>
						</a>
					</span>
				`;
			})
			.catch((cause) => {
				console.error("Failed to sell your property in a single click.", cause);
				displayAlert({ type: "error", title: "Property Sell", text: "Something went wrong" });
			});
	});
}

function sellProperty(propertyId: number) {
	const body = new URLSearchParams();
	body.set("step", "sellProperty");
	body.set("to", "agent");
	body.set("route", "properties");
	body.set("ID", propertyId.toString());

	return fetchData<TornInternalSellProperty>("torn_direct", { action: "properties.php", method: "POST", body });
}

function markPropertyAsSold(propertyWrapper: HTMLElement) {
	propertyWrapper.style.opacity = "0.3";
	findAllElements(".options-list > li a", propertyWrapper).forEach((action) => action.remove());
}

export default class NoConfirmPropertiesFeature extends Feature {
	constructor() {
		super("Properties No Confirm", "properties");
	}

	isEnabled() {
		return settings.scripts.noConfirm.propertiesSell;
	}

	initialise() {
		initialise();
	}

	async execute() {
		await startFeature();
	}

	storageKeys() {
		return ["settings.scripts.noConfirm.propertiesSell"];
	}
}

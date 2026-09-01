import { isInternalFaction } from "@common/pages/factions-page";
import { FEATURE_MANAGER, ITEM_RESOLVER } from "@common/utils/context";
import "./armory-worth.css";
import { ttCache } from "@common/utils/data/cache";
import { settings, torndata, userdata } from "@common/utils/data/database";
import { hasFactionAPIAccess } from "@common/utils/functions/api";
import { fetchData } from "@common/utils/functions/api-fetcher";
import type {
	FactionV1ArmorResponse,
	FactionV1BoostersResponse,
	FactionV1CesiumResponse,
	FactionV1DrugsResponse,
	FactionV1MedicalResponse,
	FactionV1TemporaryResponse,
	FactionV1WeaponsResponse,
} from "@common/utils/functions/api-v1.types";
import { elementBuilder } from "@common/utils/functions/dom";
import { addCustomListener, EVENT_CHANNELS } from "@common/utils/functions/events";
import { formatNumber } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import { Feature } from "@features/feature";
import type { FactionBalanceResponse, FactionBasicResponse } from "tornapi-typescript";

type ArmoryWorthFetchResponse = FactionV1WeaponsResponse &
	FactionV1ArmorResponse &
	FactionV1TemporaryResponse &
	FactionV1MedicalResponse &
	FactionV1DrugsResponse &
	FactionV1BoostersResponse &
	FactionV1CesiumResponse &
	FactionBalanceResponse &
	FactionBasicResponse;

function addListener() {
	addCustomListener(EVENT_CHANNELS.FACTION_INFO, async () => {
		if (!FEATURE_MANAGER.isEnabled(ArmoryWorthFeature)) return;

		await addWorth();
	});
}

async function addWorth() {
	document.querySelector(".tt-armory-worth")?.remove();

	const moneyLi = (await requireElement("#faction-info .f-info > li")).parentElement!;
	const selections = ["basic", "balance"];
	const legacySelections = ["weapons", "armor", "temporary", "medical", "drugs", "boosters", "cesium"] as const;

	if (userdata.faction && ttCache.hasValue("armory", userdata.faction.id)) {
		handleData(ttCache.get("armory", userdata.faction.id)!);
	} else {
		fetchData<ArmoryWorthFetchResponse>("tornv2", { section: "faction", selections, legacySelections: [...legacySelections] })
			.then((data) => {
				handleData(data);

				ttCache.set({ [data.basic.id]: data }, TO_MILLIS.SECONDS * 30, "armory");
			})
			.catch((err) => {
				console.log("Error fetching armory data: ", err);
				moneyLi.classList.add("tt-modified");
				moneyLi.appendChild(
					elementBuilder({
						type: "li",
						class: "tt-armory-worth",
						children: [
							elementBuilder({ type: "span", text: "Armory value: ", class: "bold" }),
							elementBuilder({
								type: "span",
								text: err.error === "Incorrect ID-entity relation" ? "No faction API access." : "Error during fetching API data.",
							}),
						],
					}),
				);
			});
	}

	function handleData(data: ArmoryWorthFetchResponse) {
		const itemsWorth = legacySelections
			.flatMap((type): { ID: number; quantity: number }[] => {
				const value = data[type];
				return Array.isArray(value) ? value : [];
			})
			.map((item) => (ITEM_RESOLVER.getFullItem(item.ID)?.value.market_price ?? 0) * item.quantity)
			.reduce<number>((total, worth) => total + worth, 0);

		const points = data.balance.members.map((m) => m.points).reduce((total, points) => total + points, data.balance.faction.points);
		const pointsWorth = points * torndata.stats.points_averagecost;

		const total = itemsWorth + pointsWorth;
		moneyLi.classList.add("tt-modified");
		moneyLi.appendChild(
			elementBuilder({
				type: "li",
				class: "tt-armory-worth",
				children: [
					elementBuilder({ type: "span", text: "Armory value: " }),
					elementBuilder({ type: "span", text: formatNumber(total, { currency: true }) }),
				],
			}),
		);
	}
}

export default class ArmoryWorthFeature extends Feature {
	constructor() {
		super("Armory Worth", "faction");
	}

	override precondition() {
		return isInternalFaction;
	}

	override isEnabled() {
		return settings.pages.faction.armoryWorth;
	}

	override initialise() {
		addListener();
	}

	override async reload() {
		await addWorth();
	}

	override storageKeys() {
		return ["settings.pages.faction.armoryWorth"];
	}

	override requirements() {
		if (!hasFactionAPIAccess()) return "No faction API access.";

		return true;
	}
}

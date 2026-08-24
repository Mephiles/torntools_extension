import { ITEM_RESOLVER } from "@common/utils/context.ts";
import { userdata } from "@common/utils/data/database.ts";
import { hasAPIData } from "@common/utils/functions/api.ts";
import { elementBuilder } from "@common/utils/functions/dom.ts";
import { ALLOWED_BLOOD, getBloodType, getHospitalTime, getMedicalCooldown, getUserLife } from "@common/utils/functions/torn.ts";
import type { BloodType } from "@common/utils/functions/torn.ts";
import { TO_MILLIS } from "@common/utils/functions/utilities.ts";
import { isFullItem } from "@common/utils/torn-api/items.types.ts";
import type { StaticItem } from "@common/utils/torn-api/items.types.ts";
import type { QuickItem, QuickItemId } from "@features/quick-items/shared/quick-items-common.ts";
import styles from "./special-actions.module.css";

export const SPECIAL_MEDICAL_LIFE = "special--medical-life";
export const SPECIAL_MEDICAL_HOSPITAL = "special--medical-hospital";

export function isSpecialAction(id: QuickItemId) {
	const ALL_SPECIAL_ACTIONS: QuickItemId[] = [SPECIAL_MEDICAL_LIFE, SPECIAL_MEDICAL_HOSPITAL];

	return ALL_SPECIAL_ACTIONS.includes(id);
}

export interface SpecialAction {
	name: string;
	class: string;
}

export function getSpecialAction(id: QuickItemId): SpecialAction {
	if (id === SPECIAL_MEDICAL_HOSPITAL) return { name: "Medical: Leave Hospital", class: "special-medical-hospital" };
	if (id === SPECIAL_MEDICAL_LIFE) return { name: "Medical: Optimal Life", class: "special-medical-life" };
	throw new Error(`Unknown quick-item special action: ${id}`);
}

export function toggleSpecialQuickOptions(content: HTMLElement, addQuickItem: (item: QuickItem) => void, saveQuickItems: () => Promise<void>) {
	const existingOptions = content.querySelector(`.${styles.specialOptions}`);
	if (existingOptions) {
		existingOptions.remove();
		return;
	}

	content.appendChild(
		elementBuilder({
			type: "div",
			class: styles.specialOptions,
			children: [
				elementBuilder({ type: "hr" }),
				elementBuilder({
					type: "div",
					class: styles.specialTitle,
					text: "Special Options",
				}),
				buildSpecialActionPreview(SPECIAL_MEDICAL_HOSPITAL, addQuickItem, saveQuickItems),
				buildSpecialActionPreview(SPECIAL_MEDICAL_LIFE, addQuickItem, saveQuickItems),
			],
		}),
	);
}

function buildSpecialActionPreview(id: QuickItemId, addQuickItem: (item: QuickItem) => void, saveQuickItems: () => Promise<void>) {
	const action = getSpecialAction(id);

	return elementBuilder({
		type: "div",
		class: [styles.specialActionPreview, action.class],
		text: action.name,
		events: {
			click() {
				addQuickItem({ id });
				void saveQuickItems();
			},
		},
	});
}

export function customError(responseWrap: HTMLElement, message: string) {
	responseWrap.appendChild(elementBuilder({ type: "div", class: "custom-error", text: message }));
}

let medicalLoaded = false;
const medicalQuantities = new Map<number, number>();

const MEDICAL_EFFECT_REGEX = /Reduces hospital time by (\d+) (?:mins|minutes) and restores (\d+)% life. Increases medical cooldown by (\d+) mins./;

type MedicalStaticItem = StaticItem & {
	quantity: number;
	medical: {
		time: number;
		life: number;
		cooldown: number;
	};
};

type OptimalHospitalResponse = { error: string } | { items: { id: number; cooldown: number }[] };

export interface MedicalItemsSource {
	loadFromDOM(): { id: number; quantity: number }[] | null;
	loadDirectly(): Promise<{ id: number; quantity: number }[]>;
}

export interface MedicalActionOptions {
	responseWrap: HTMLElement;
	useItem: (id: number) => Promise<unknown>;
	source: MedicalItemsSource;
}

export async function executeSpecialAction(id: QuickItemId, options: MedicalActionOptions) {
	if (!isSpecialAction(id)) return;

	options.responseWrap.style.display = "block";
	options.responseWrap.textContent = "";

	await loadMedicalItems(options.source, false);

	if (id === SPECIAL_MEDICAL_HOSPITAL) {
		await executeMedicalHospitalAction(options);
	} else if (id === SPECIAL_MEDICAL_LIFE) {
		await executeMedicalLifeAction(options);
	}
}

async function executeMedicalHospitalAction(options: MedicalActionOptions) {
	const hospitalTime = getHospitalTime();
	if (hospitalTime === null) {
		customError(options.responseWrap, "You aren't hospitalized.");
		return;
	}

	if (!medicalLoaded) {
		await loadMedicalItems(options.source, true)
			.then(() => customError(options.responseWrap, "Loaded your medical items to find the best fit. Click again to continue."))
			.catch(() => customError(options.responseWrap, "Failed to load your medical items. Try again or report this issue to the TornTools developers."));
		return;
	}

	const minutesLeft = (hospitalTime - Date.now()) / TO_MILLIS.MINUTES;
	const path = findOptimalHospitalItems(minutesLeft, getBloodType());
	if (!path) {
		customError(options.responseWrap, "We couldn't find any feasible item to use.");
		return;
	} else if ("error" in path) {
		customError(options.responseWrap, path.error);
		return;
	}

	const currentCooldown = await getMedicalCooldown();
	if (!currentCooldown) {
		customError(options.responseWrap, "Failed to get your current cooldown timer. Report this to the TornTools developers.");
		return;
	}

	const cooldownRequired = path.items.reduce((total, item) => total + item.cooldown, 0);
	if (currentCooldown.remainder < cooldownRequired) {
		customError(options.responseWrap, "You don't have sufficient cooldown left to leave the hospital.");
		return;
	}

	const bestItem = path.items[0];
	await options.useItem(bestItem.id);
	medicalQuantities.set(bestItem.id, medicalQuantities.get(bestItem.id) - 1);
}

async function executeMedicalLifeAction(options: MedicalActionOptions) {
	const [life, maxLife] = getUserLife();
	if (life >= maxLife) {
		customError(options.responseWrap, "You are already at full life.");
		return;
	}

	if (!medicalLoaded) {
		await loadMedicalItems(options.source, true)
			.then(() => customError(options.responseWrap, "Loaded your medical items to find the best fit. Click again to continue."))
			.catch(() => customError(options.responseWrap, "Failed to load your medical items. Try again or report this issue to the TornTools developers."));
		return;
	}

	const missingLife = maxLife - life;
	const percentage = (missingLife / maxLife) * 100;

	const item = getOptimalLifeItem(percentage, getBloodType());
	if (!item) {
		customError(options.responseWrap, "There is no good medical item present in your inventory to actually use.");
		return;
	}

	await options.useItem(item.id);
	medicalQuantities.set(item.id, medicalQuantities.get(item.id) - 1);
}

function findOptimalHospitalItems(minutesLeft: number, bloodType: BloodType | null): OptimalHospitalResponse {
	const items = availableMedicalItems(bloodType);
	if (!items.length) return { error: "We couldn't find any feasible item to use." };

	let ongoingMinutesLeft = minutesLeft;
	const ids: { id: number; cooldown: number }[] = [];
	while (ongoingMinutesLeft > 0) {
		const remainderItems = items.filter(({ quantity }) => quantity > 0);
		if (!remainderItems.length) return { error: "You lack the items to leave the hospital." };

		const item = remainderItems.find((i) => i.medical.time >= ongoingMinutesLeft) ?? remainderItems.at(-1);
		item.quantity--;
		ids.push({ id: item.id, cooldown: item.medical.cooldown });
		ongoingMinutesLeft -= item.medical.time;
	}

	return { items: ids };
}

function getOptimalLifeItem(percentageMissing: number, bloodType: BloodType | null): MedicalStaticItem | null {
	const items = availableMedicalItems(bloodType);
	if (!items.length) return null;

	const fillItems = items.filter((item) => item.medical.life >= percentageMissing);
	if (fillItems.length) return fillItems[0];

	const bestLife = items.at(-1).medical.life;
	return items.find((i) => i.medical.life === bestLife);
}

function availableMedicalItems(bloodType: BloodType | null) {
	const perks = (hasAPIData() ? (userdata?.perks.education ?? []) : [])
		.filter((perk) => perk.toLowerCase().includes("medical item effectiveness"))
		.map((perk) => parseInt(perk.match(/\+ (\d+)%/i)[1]))
		.reduce((a, b) => a + b, 0);

	return (ITEM_RESOLVER.hasFullItems() ? ITEM_RESOLVER.getAllFullItems() : ITEM_RESOLVER.getAllStaticItems())
		.filter(({ type, effect }) => type === "Medical" && effect)
		.map((item): MedicalStaticItem => {
			const effectMatched = MEDICAL_EFFECT_REGEX.exec(item.effect);
			if (!effectMatched) return null;

			if (item.name.startsWith("Blood Bag") && (bloodType === null || !ALLOWED_BLOOD[bloodType].includes(item.id))) return null;

			const time = (1 + perks / 100) * parseInt(effectMatched[1]);
			const life = (1 + perks / 100) * parseInt(effectMatched[2]);
			const cooldown = parseInt(effectMatched[3]);
			const quantity = medicalQuantities.get(item.id) ?? 0;

			return {
				...item,
				quantity,
				medical: {
					time,
					life,
					cooldown,
				},
			};
		})
		.filter((item) => !!item)
		.filter((item) => item.quantity > 0)
		.sort((a, b) => {
			if (b.medical.time !== a.medical.time) return a.medical.time - b.medical.time;
			if (b.medical.cooldown !== a.medical.cooldown) return a.medical.cooldown - b.medical.cooldown;

			if (isFullItem(a) && isFullItem(b)) {
				return a.value.market_price - b.value.market_price;
			}

			return a.name.localeCompare(b.name);
		});
}

async function loadMedicalItems(source: MedicalItemsSource, manualAction: boolean) {
	if (medicalLoaded) return;

	const items = source.loadFromDOM();
	if (items) {
		registerMedicalItems(items);
		medicalLoaded = true;
	} else if (manualAction) {
		registerMedicalItems(await source.loadDirectly());
		medicalLoaded = true;
	}
}

function registerMedicalItems(items: { id: number; quantity: number }[]) {
	for (const { id, quantity } of items) medicalQuantities.set(id, quantity);
}

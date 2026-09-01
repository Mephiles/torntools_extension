import "./live-networth.css";
import { settings, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { createContainer } from "@common/utils/functions/containers";
import { elementBuilder, findElementWithText } from "@common/utils/functions/dom";
import { formatNumber, formatTime } from "@common/utils/functions/formatting";
import { requireContent } from "@common/utils/functions/requires";
import { getPageStatus, isAbroad, isFlying } from "@common/utils/functions/torn";
import { Feature } from "@features/feature";
import type { UserNetworthResponse, UserPersonalStatsFull } from "tornapi-typescript";

interface NetworthType {
	label: string;
	liveGetter: (data: UserNetworthResponse) => number;
	snapshotGetter: (data: UserPersonalStatsFull) => number;
}

const NETWORTH_TYPES: NetworthType[] = [
	{
		label: "Cash on hand",
		liveGetter: (data) => data.networth.money.wallet,
		snapshotGetter: (data) => data.personalstats.networth.wallet,
	},
	{
		label: "Cash in vaults",
		liveGetter: (data) => data.networth.money.vault,
		snapshotGetter: (data) => data.personalstats.networth.vaults,
	},
	{
		label: "Points",
		liveGetter: (data) => data.networth.points,
		snapshotGetter: (data) => data.personalstats.networth.points,
	},
	{
		label: "Items",
		liveGetter: (data) => data.networth.items.inventory,
		snapshotGetter: (data) => data.personalstats.networth.inventory,
	},
	{
		label: "Bazaar",
		liveGetter: (data) => data.networth.items.bazaar,
		snapshotGetter: (data) => data.personalstats.networth.bazaar,
	},
	{
		label: "Display Case",
		liveGetter: (data) => data.networth.items.display_case,
		snapshotGetter: (data) => data.personalstats.networth.display_case,
	},
	{
		label: "Bank",
		liveGetter: (data) => data.networth.money.city_bank,
		snapshotGetter: (data) => data.personalstats.networth.bank,
	},
	{
		label: "Trade",
		liveGetter: (data) => data.networth.items.trades + data.networth.money.pending,
		snapshotGetter: (data) => data.personalstats.networth.pending,
	},
	{
		label: "Piggy Bank",
		liveGetter: (data) => data.networth.money.piggy_bank,
		snapshotGetter: (data) => data.personalstats.networth.piggy_bank,
	},
	{
		label: "Stock Market",
		liveGetter: (data) => data.networth.assets.stock_market,
		snapshotGetter: (data) => data.personalstats.networth.stock_market,
	},
	{
		label: "Company",
		liveGetter: (data) => data.networth.assets.company,
		snapshotGetter: (data) => data.personalstats.networth.company,
	},
	{
		label: "Bookie",
		liveGetter: (data) => data.networth.money.bookie,
		snapshotGetter: (data) => data.personalstats.networth.bookie,
	},
	{
		label: "Auction House",
		liveGetter: (data) => data.networth.items.auction_house,
		snapshotGetter: (data) => data.personalstats.networth.auction_house,
	},
	{
		label: "Cayman",
		liveGetter: (data) => data.networth.money.cayman_bank,
		snapshotGetter: (data) => data.personalstats.networth.overseas_bank,
	},
	{
		label: "Properties",
		liveGetter: (data) => data.networth.assets.property,
		snapshotGetter: (data) => data.personalstats.networth.property,
	},
	{
		label: "Enlisted Cars",
		liveGetter: (data) => data.networth.items.enlisted_cars,
		snapshotGetter: (data) => data.personalstats.networth.enlisted_cars,
	},
	{
		label: "Item Market",
		liveGetter: (data) => data.networth.items.item_market,
		snapshotGetter: (data) => data.personalstats.networth.item_market,
	},
	{
		label: "Loan",
		liveGetter: (data) => data.networth.money.loans,
		snapshotGetter: (data) => data.personalstats.networth.loans,
	},
	{
		label: "Total",
		liveGetter: (data) => data.networth.total,
		snapshotGetter: (data) => data.personalstats.networth.total,
	},
];

async function showNetworth() {
	await requireContent();

	const { content } = createContainer("Live Networth", {
		collapsible: false,
		showHeader: false,
		applyRounding: false,
		compact: true,
		parentElement: findElementWithText("h5", "General Information").parentElement.nextElementSibling.querySelector("ul.info-cont-wrap"),
	});
	const networthRow = newRow("(Live) Networth", formatNumber(userdata.networth.total, { currency: true }));

	// Networth last updated info icon
	const infoIcon = elementBuilder({
		type: "i",
		class: "networth-info-icon",
		attributes: {
			updatedAt: userdata.networth.timestamp,
			title: `Last updated ${formatTime({ seconds: userdata.networth.timestamp }, { type: "ago" })}`,
			style: "margin-left: 9px;",
		},
	});
	networthRow.querySelector(".desc").appendChild(infoIcon);
	content.appendChild(networthRow);

	// Update 'last updated'
	setInterval(() => {
		if (infoIcon.hasAttribute("aria-describedby")) return;

		const updated = parseInt(infoIcon.getAttribute("updatedAt"));

		infoIcon.setAttribute("title", `Last updated: ${formatTime({ seconds: updated }, { type: "ago" })}`);
	}, 1000);

	const table = elementBuilder({
		type: "table",
		class: "tt-networth-comparison",
		children: [
			elementBuilder({
				type: "tr",
				children: ["Type", "Value", "Change"].map((value) => elementBuilder({ type: "th", text: value })),
			}),
		],
	});

	NETWORTH_TYPES.forEach(addToTable);

	content.appendChild(
		elementBuilder({
			type: "li",
			class: "comparison",
			children: [
				table,
				elementBuilder({
					type: "div",
					class: "tt-networth-footer",
					text: `Networth change compared to Torn's last known Networth (updated ${formatTime({ seconds: userdata.networth.timestamp }, { type: "ago" })})`,
				}),
			],
		}),
	);

	function newRow(name: string, value: string) {
		return elementBuilder({
			type: "li",
			class: "networth-row",
			children: [
				elementBuilder({ type: "div", class: "divider", children: [elementBuilder({ type: "span", text: name })] }),
				elementBuilder({ type: "div", class: "desc", children: [elementBuilder({ type: "span", text: value })] }),
			],
		});
	}

	function addToTable(type: NetworthType) {
		const previous = type.snapshotGetter(userdata);
		const current = type.liveGetter(userdata);

		if (current === previous) return;

		const isPositive = current > previous;

		table.appendChild(
			elementBuilder({
				type: "tr",
				children: [
					elementBuilder({ type: "td", text: type.label }),
					elementBuilder({ type: "td", text: formatNumber(current, { shorten: true, currency: true }) }),
					elementBuilder({
						type: "td",
						text: formatNumber(current - previous, { shorten: true, currency: true, forceOperation: true }),
						class: isPositive ? "positive" : "negative",
					}),
				],
			}),
		);
	}
}

export default class LiveNetworthFeature extends Feature {
	constructor() {
		super("Live Networth", "home");
	}

	override precondition() {
		return getPageStatus().access && !isFlying() && !isAbroad();
	}

	override requirements() {
		if (!hasAPIData() || !settings.apiUsage.user.networth) return "No API access.";

		return true;
	}

	override isEnabled() {
		return settings.pages.home.networthDetails;
	}

	override async execute() {
		await showNetworth();
	}

	override storageKeys() {
		return ["settings.pages.home.networthDetails", "userdata.networth"];
	}
}

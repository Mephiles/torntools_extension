import "./points-value.css";
import { Feature } from "@/features/feature-manager";
import { settings, torndata } from "@/utils/common/data/database";
import { hasAPIData } from "@/utils/common/functions/api";
import { checkDevice, executeScript, findAllElements, isElement } from "@/utils/common/functions/dom";
import { convertToNumber, formatNumber } from "@/utils/common/functions/formatting";
import { requireSidebar } from "@/utils/common/functions/requires";

function setTitleAttributes() {
	findAllElements(".tt-points-value > span").forEach((element) => {
		const value = torndata.stats.points_averagecost;
		const points = convertToNumber(element.parentElement.querySelector("span[class*='value___']").textContent);

		element.setAttribute(
			"title",
			`${formatNumber(value, { currency: true })} | ${formatNumber(points)}x = ${formatNumber(value * points, {
				currency: true,
				shorten: 2,
			})}`,
		);
	});
}

async function showValue() {
	await requireSidebar();

	const block = document.evaluate(
		`
			(
				//a[@id='pointsPoints']
				| 
				//div[@id='sidebarroot']
					//span[contains(@class, 'name___')][contains(., 'Points')]
			)
				/parent::p[contains(@class, 'point-block___')]
		`,
		document,
		null,
		XPathResult.FIRST_ORDERED_NODE_TYPE,
		null,
	)?.singleNodeValue;
	if (!block || !isElement(block)) {
		console.warn("Couldn't find your points block for some odd reason.");
		return;
	}

	block.classList.add("tt-points-value");
	block.addEventListener("mouseover", setTitleAttributes);
	setTitleAttributes();

	executeScript(browser.runtime.getURL("/points-value--inject.js"));
}

function removeValue() {
	const block = document.querySelector(".tt-points-value");
	if (!block) return;

	block.classList.remove("tt-points-value");
	block.removeEventListener("mouseover", setTitleAttributes);
	for (const elements of findAllElements(":scope > span", block)) elements.removeAttribute("title");
}

export default class PointsValueFeature extends Feature {
	constructor() {
		super("Points Value", "sidebar");
	}

	async requirements() {
		const devices = await checkDevice();
		if (devices.mobile || devices.tablet) return "Not supported on mobiles or tablets!";

		if (!hasAPIData()) return "No API access.";
		return true;
	}

	isEnabled() {
		return settings.pages.sidebar.pointsValue;
	}

	async execute() {
		await showValue();
	}

	cleanup() {
		removeValue();
	}

	storageKeys() {
		return ["settings.pages.sidebar.pointsValue"];
	}
}

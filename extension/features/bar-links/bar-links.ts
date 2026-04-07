import "./bar-links.css";
import { ExecutionTiming, Feature } from "@/features/feature-manager";
import { settings } from "@/utils/common/data/database";
import { checkDevice } from "@/utils/common/functions/dom";
import { isInCountry } from "@/utils/common/functions/torn";
import { requireSidebar } from "@/utils/common/functions/requires";

const BAR_LINKS: Record<string, () => string> = {
	"[class*='bar__'][class*='energy__']": () => {
		return isInCountry("south-africa") ? "https://www.torn.com/index.php?page=hunting" : "https://www.torn.com/gym.php";
	},
	"[class*='bar__'][class*='nerve___']": () => "https://www.torn.com/crimes.php",
};

function onClick(event: MouseEvent) {
	const bar = (event.target as Element).closest("div[class*='bar___']");
	if (!bar) return;

	const linkValue = Object.entries(BAR_LINKS).find(([selector]) => bar.matches(selector));
	if (!linkValue) return;

	const link = linkValue[1]();

	let target: string;
	if (event.button === 1) target = "_blank";
	else target = "_self";

	window.open(link, target);
}

async function addLinks() {
	await requireSidebar();

	Object.keys(BAR_LINKS)
		.map((selector) => document.querySelector<HTMLElement>(selector))
		.filter((bar) => !!bar)
		.forEach((barLink) => {
			barLink.removeAttribute("href");
			barLink.addEventListener("click", onClick);
			barLink.addEventListener("mouseup", (event) => {
				if (event.button !== 1) return; // 1 is middle click

				onClick(event);
			});
			barLink.classList.add("bar-link");
		});
}

function removeLinks() {
	Object.keys(BAR_LINKS)
		.map((selector) => document.querySelector<HTMLElement>(selector))
		.forEach((barName) => {
			barName.removeEventListener("click", onClick);
			barName.classList.remove("bar-link");
		});
}

export default class BarLinksFeature extends Feature {
	constructor() {
		super("Bar Links", "sidebar", ExecutionTiming.IMMEDIATELY);
	}

	async requirements() {
		const { mobile } = await checkDevice();
		if (mobile) return "Not supported on mobile!";

		return true;
	}

	isEnabled() {
		return settings.pages.sidebar.barLinks;
	}

	async execute() {
		await addLinks();
	}

	cleanup() {
		removeLinks();
	}

	storageKeys() {
		return ["settings.pages.sidebar.barLinks"];
	}
}

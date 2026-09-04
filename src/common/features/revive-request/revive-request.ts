import "./revive-request.css";
import { FEATURE_MANAGER } from "@common/utils/context";
import { settings } from "@common/utils/data/database";
import { calculateRevivePrice, doRequestRevive } from "@common/utils/functions/api-external-revives";
import { checkDevice, elementBuilder, isElement } from "@common/utils/functions/dom";
import { findElement } from "@common/utils/functions/find-elements";
import { capitalizeText } from "@common/utils/functions/formatting";
import { requireElement } from "@common/utils/functions/requires";
import { getFactionName, getPage, getUserDetails, isFlying } from "@common/utils/functions/torn";
import { TO_MILLIS } from "@common/utils/functions/utilities";
import { PHFillStethoscope } from "@common/utils/icons/phosphor-icons";
import { Feature } from "@features/feature";

let observer: MutationObserver;
let page: string;

async function initialiseListeners() {
	observer = new MutationObserver(() => {
		if (!FEATURE_MANAGER.isEnabled(ReviveRequestFeature)) return;

		if (isHospitalised()) showButton();
		else removeButton();
	});
	observer.observe(document.body, { attributes: true, attributeFilter: ["data-layout"] });

	if (page === "russianRoulette") {
		await requireElement("#react-root");

		new MutationObserver(() => {
			if (!isHospitalised()) return;

			showButton();
		}).observe(findElement("#react-root"), { childList: true });
	} else if (page === "forums") {
		await requireElement("#forums-page-wrap");

		new MutationObserver((mutations) => {
			if (
				!isHospitalised() ||
				!mutations
					.filter((mutation) => mutation.addedNodes.length)
					.flatMap((mutation) => Array.from(mutation.addedNodes))
					.filter(isElement)
					.map((node) => node.className)
					.filter((name) => !!name)
					.some((name) => name.includes("content-title"))
			)
				return;

			showButton();
		}).observe(findElement("#forums-page-wrap"), { childList: true });
	}
}

function startFeature() {
	if (isHospitalised()) showButton();
	else removeButton();
}

function showButton() {
	removeButton();

	const button = elementBuilder({
		type: "button",
		class: "tt-revive",
		children: [PHFillStethoscope(), elementBuilder({ type: "span", text: "Request Revive" })],
		events: { click: requestRevive },
	});

	const parent = getParent();
	if (!parent) return;

	if (page === "item" && parent.id === "top-page-links-list") {
		parent.appendChild(button);
	} else {
		parent.insertAdjacentElement("beforebegin", button);
	}

	function getParent() {
		return (
			(page === "item" && findElement("#top-page-links-list", true)) ||
			findElement(".links-footer, .content-title .clear, .forums-main-wrap, [class*='linksContainer___']", true) ||
			findElement(".links-top-wrap", true)
		);
	}

	async function requestRevive() {
		const details = getUserDetails();
		if ("error" in details) return false;

		button.setAttribute("disabled", "");

		const { id, name } = details;
		const faction = getFactionName();

		let country = document.body.dataset.country!;
		if (country === "uk") country = "United Kingdom";
		else if (country === "uae") country = "UAE";
		else country = capitalizeText(country.replaceAll("-", " "), { everyWord: true });

		doRequestRevive(String(id), name, country, faction)
			.then(({ provider }) => displayMessage(`Revive requested for ${calculateRevivePrice(provider)}!`))
			.catch(({ provider, response }) => {
				if (response.code === "COOLDOWN") {
					displayMessage("Cooldown, wait for a little bit!", true);
					button.removeAttribute("disabled");
				} else {
					displayMessage("Failed to request!", true);
					button.removeAttribute("disabled");
					console.log(`TT - Failed to request a revive with ${provider.name}!`, response);
				}
			});
		return true;
	}

	function displayMessage(message: string, error: boolean = false) {
		const element = findElement("span", button);
		element.textContent = message;
		if (!error) element.classList.add("tt-revive-success");

		setTimeout(() => {
			element.textContent = "Request Revive";
			element.classList.remove("tt-revive-success");
		}, 10 * TO_MILLIS.SECONDS);
	}
}

function isHospitalised() {
	return document.body.dataset.layout === "hospital";
}

function removeButton() {
	findElement(".tt-revive", true)?.remove();
}

export default class ReviveRequestFeature extends Feature {
	constructor() {
		super("Revive Request", "global");
		page = getPage();
	}

	override async requirements() {
		const devices = await checkDevice();
		if (devices.mobile || devices.tablet) return "Not supported on mobiles or tablets!";
		else if (isFlying()) return false;

		return true;
	}

	override isEnabled() {
		return !!settings.pages.global.reviveProvider;
	}

	override async initialise() {
		await initialiseListeners();
	}

	override execute() {
		startFeature();
	}

	override storageKeys() {
		return ["settings.pages.global.reviveProvider"];
	}
}

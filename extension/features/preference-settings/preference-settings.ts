import "./preference-settings.css";
import { Feature } from "@/features/feature-manager";
import { api } from "@/utils/common/data/database";
import { changeAPIKey } from "@/utils/common/functions/api";
import { createContainer, removeContainer } from "@/utils/common/functions/containers";
import { elementBuilder, findAllElements, getHashParameters, getSearchParameters } from "@/utils/common/functions/dom";
import { requireElement } from "@/utils/common/functions/requires";

async function executeFeature() {
	const searchParams = getSearchParameters();
	if (searchParams.get("torntools") === "connect") connectRedirect();

	showContainer();

	function showContainer() {
		const { options } = createContainer("TornTools - Settings", { id: "tt-settings-container", defaultPosition: true, onlyHeader: true, class: "mt10" });

		options.appendChild(
			elementBuilder({
				type: "a",
				class: "preference-button",
				text: "Settings",
				href: browser.runtime.getURL("/options.html"),
				attributes: { target: "_blank" },
			}),
		);

		const connectButton = elementBuilder({ type: "a", class: "preference-button", text: "Connect", id: "connect-torntools" });
		options.appendChild(connectButton);

		if (api.torn.key) {
			connectButton.setAttribute("disabled", "");
			connectButton.removeAttribute("href");
			connectButton.textContent = "Connected!";
		} else {
			handleKeyView(connectButton);
			findAllElements("#prefs-tab-menu .headers > li").forEach((item) => item.addEventListener("click", () => handleKeyView(connectButton)));
		}
	}

	function isViewingKeys() {
		const tab = getHashParameters().get("tab");

		return tab === "api" || tab === "api?";
	}

	function handleKeyView(connectButton: HTMLAnchorElement) {
		if (isViewingKeys()) {
			requireElement("[class*='api___']").then(async (apiContainer) => {
				await requireElement("li[class*='keyRow___']", { parent: apiContainer });

				const defaultKey = findAllElements("li[class*='keyRow___']", apiContainer)
					.find((element) => !element.querySelector("[class*='name___']").textContent)
					?.querySelector("input").value;

				connectButton.textContent = "Connect";
				connectButton.classList.remove("tt-hidden");

				if (defaultKey) {
					// Using onclick to avoid multiple events.
					connectButton.onclick = () => updateKey(defaultKey);
					connectButton.removeAttribute("href");
					connectButton.setAttribute("title", "Connect using the default key.");
				} else {
					connectButton.href = "preferences.php?torntools=connect#tab=api?&step=addNewKey&title=TornTools&type=3";
					connectButton.setAttribute("title", "Connect with a newly generated API key.");
				}
			});
		} else {
			connectButton.classList.add("tt-hidden");
		}
	}

	function updateKey(key: string) {
		const connectButton = document.querySelector("#connect-torntools");

		changeAPIKey(key).then(() => {
			connectButton.setAttribute("disabled", "");
			connectButton.textContent = "Connected!";
			connectButton.removeAttribute("href");
		});
	}

	function connectRedirect() {
		requireElement("[id^='key-popup-']").then((input) => updateKey(input.value));
	}
}

function dispose() {
	removeContainer("TornTools - Settings", { id: "tt-settings-container" });
}

export default class PreferenceSettingsFeature extends Feature {
	constructor() {
		super("Preference Settings", "preferences");
	}

	isEnabled() {
		return true;
	}

	async execute() {
		await executeFeature();
	}

	cleanup() {
		dispose();
	}
}

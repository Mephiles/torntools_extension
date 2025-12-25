(() => {
	featureManager.registerFeature(
		"Efficient Rehab",
		"travel",
		() => settings.pages.travel.efficientRehab,
		addListener,
		showInformation,
		removeInformation,
		{ storage: ["settings.pages.travel.efficientRehab", "settings.apiUsage.user.personalstats"] },
		() => {
			if (!hasAPIData() || !settings.apiUsage.user.personalstats) return "No API access.";

			return true;
		}
	);

	let isInjected = false;
	let knownPercentages: any;

	function addListener() {
		executeScript(chrome.runtime.getURL("scripts/features/efficient-rehab/ttEfficientRehab.inject.js"));
		window.addEventListener("tt-injected--efficient-rehab", () => (isInjected = true));

		addXHRListener(async ({ detail }) => {
			if (!("json" in detail)) return;

			const { page, xhr, json } = detail;

			if (page === "travelagency") {
				const params = new URLSearchParams(xhr.requestBody);
				const step = params.get("step");

				if (step === "tryRehab") {
					removeInformation();
					void showInformation();
				} else if (step === "checkAddiction" && !!json) {
					knownPercentages = json.percentages;
					removeInformation();
					void showInformation();
				}
			}
		});
	}

	async function showInformation() {
		await requireCondition(() => isInjected);

		const percentages = knownPercentages ?? JSON.parse((await requireElement("#rehub-progress .range-slider-data")).dataset.percentages);

		const maxRehabs = parseInt(Object.keys(percentages).reverse()[0]);
		const { safe } = calculateSafeRehabs();

		const informationElement = document.newElement({
			type: "div",
			class: "tt-efficient-rehab",
			children: [
				"For full efficiency, leave at least ",
				document.newElement({ type: "span", class: "tt-efficient-rehab--amount", text: safe }),
				" rehabs. ",
			],
		});
		if (safe >= maxRehabs) {
			informationElement.appendChild(document.createTextNode("This means that you "));
			informationElement.appendChild(
				document.newElement({ type: "span", class: "tt-efficient-rehab--amount tt-efficient-rehab--too-much", text: "shouldn't" })
			);
			informationElement.appendChild(document.createTextNode(" rehab at all."));
		} else {
			informationElement.appendChild(document.createTextNode("This means that you should rehab up to "));
			informationElement.appendChild(document.newElement({ type: "span", class: "tt-efficient-rehab--amount", text: maxRehabs - safe }));
			informationElement.appendChild(document.createTextNode(` time${applyPlural(maxRehabs - safe)}.`));
		}

		if (settings.pages.travel.efficientRehabSelect) {
			window.dispatchEvent(new CustomEvent("tt-efficient-rehab", { detail: { ticks: Math.max(maxRehabs - safe, 1) } }));
		}

		document.querySelector(".rehab-desc").insertAdjacentElement("afterend", informationElement);
	}

	function calculateSafeRehabs() {
		const rehabsDone = userdata.personalstats.drugs.rehabilitations.amount;

		const costAP = rehabsDone <= 19_232 ? rehabsDone * 12.85 + 2_857.14 : 250_000;
		const rehabAP = parseInt(Math.round((250_000 / costAP) * 100).toString()) / 100;

		return {
			minimum: Math.ceil(20 / rehabAP),
			safe: Math.ceil(19 / rehabAP + 1),
		};
	}

	function removeInformation() {
		Array.from(document.querySelectorAll(".tt-efficient-rehab")).forEach((x) => x.remove());
	}
})();

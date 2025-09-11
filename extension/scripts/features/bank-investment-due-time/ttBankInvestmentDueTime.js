"use strict";

(async () => {
	if (!getPageStatus().access) return;

	featureManager.registerFeature(
		"Bank Investment Due Time",
		"bank",
		() => settings.pages.bank.investmentDueTime,
		null,
		initialize,
		teardown,
		{
			storage: ["settings.pages.bank.investmentDueTime"],
		},
		() => {
			if (!hasAPIData() || !settings.apiUsage.userV2.money) return "No API access.";
		}
	);

	function createBankInvestmentFacade(node) {
		const investmentTimeLeftElement = node;

		const dueDate = new Date(userdata.money.city_bank.until * 1000);
		const formattedDate = formatDate(dueDate, { showYear: true });
		const formattedTime = formatTime(dueDate);
		const formatted = `${formattedDate} ${formattedTime}`;

		const investmentDueTimeElement = document.newElement({
			type: "span",
			children: [
				document.createTextNode("Investment will be completed on "),
				document.newElement({
					type: "b",
					text: formatted,
				}),
			],
		});

		investmentTimeLeftElement.insertAdjacentElement("afterend", investmentDueTimeElement);

		function dispose() {
			investmentDueTimeElement.remove();
		}

		return {
			dispose,
		};
	}

	let bankInvestmentFacade;

	async function initialize() {
		bankInvestmentFacade = createBankInvestmentFacade(await requireElement("p.m-clear"));
	}

	function teardown() {
		bankInvestmentFacade?.dispose();
		bankInvestmentFacade = undefined;
	}
})();

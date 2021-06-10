"use strict";

(async () => {
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
		null
	);

	function createBankInvestmentFacade() {
		const investmentTimeLeftElement = document.find("p.m-clear");

		const bankDueDateMs = new Date().setSeconds(userdata.city_bank.time_left);
		const formattedDate = formatDate({ milliseconds: bankDueDateMs }, { showYear: true });
		const formattedTime = formatTime(bankDueDateMs);
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
		await requireElement("p.m-clear");

		bankInvestmentFacade = createBankInvestmentFacade();
	}

	function teardown() {
		bankInvestmentFacade.dispose();
		bankInvestmentFacade = undefined;
	}
})();

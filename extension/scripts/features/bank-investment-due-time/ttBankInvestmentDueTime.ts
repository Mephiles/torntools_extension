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
			storage: ["settings.pages.bank.investmentDueTime", "userdata.money.city_bank.until"],
		},
		() => {
			if (!hasAPIData() || !settings.apiUsage.user.money) return "No API access.";
			else if (!userdata.money.city_bank.until) return "No active investment.";

			return true;
		}
	);

	function createBankInvestmentFacade(investmentTimeLeftElement: Element) {
		if (userdata.money.city_bank === null) return { dispose: () => {} };

		const dueDate = new Date(userdata.money.city_bank.until * 1000);
		const formattedDate = formatDate(dueDate, { showYear: true });
		const formattedTime = formatTime(dueDate);
		const formatted = `${formattedDate} ${formattedTime}`;

		const investmentDueTimeElement = elementBuilder({
			type: "span",
			children: [
				document.createTextNode("Investment will be completed on "),
				elementBuilder({
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

	let bankInvestmentFacade: ReturnType<typeof createBankInvestmentFacade> | undefined;

	async function initialize() {
		bankInvestmentFacade = createBankInvestmentFacade(await requireElement("p.m-clear"));
	}

	function teardown() {
		bankInvestmentFacade?.dispose();
		bankInvestmentFacade = undefined;
	}
})();

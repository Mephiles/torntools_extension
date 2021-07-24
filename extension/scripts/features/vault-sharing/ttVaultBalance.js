"use strict";

(async () => {
	if (await checkMobile()) return "Not supported on mobile!";

	featureManager.registerFeature(
		"Vault Balance",
		"vault sharing",
		() => settings.scripts.vaultSharing.sidebar,
		null,
		showBalance,
		removeBalance,
		{
			storage: [
				"settings.scripts.vaultSharing.sidebar",
				"settings.scripts.vaultSharing.sidebarTotal",
				"localdata.vault.total",
				"localdata.vault.user.current",
			],
		},
		null
	);

	async function showBalance() {
		await requireSidebar();

		removeBalance();

		const isTotal = !localdata.vault.initialized || settings.scripts.vaultSharing.sidebarTotal;
		const money = isTotal ? localdata.vault.total : localdata.vault.user.current;

		const moneyBlock = document.find("#user-money").parentElement;
		moneyBlock.parentElement.insertBefore(
			document.newElement({
				type: "p",
				class: "tt-vault-balance",
				children: [
					document.newElement({ type: "span", class: "name", text: `Vault${isTotal ? "*" : ""}:` }),
					document.newElement({ type: "span", class: "value", text: formatNumber(money, { currency: true }) }),
				],
			}),
			moneyBlock.nextElementSibling
		);
	}

	function removeBalance() {
		const balance = document.find(".tt-vault-balance");
		if (balance) balance.remove();
	}
})();

(async () => {
	if (!isAbroad()) return;

	featureManager.registerFeature(
		"Abroad Buy No Confirm",
		"no confirm",
		() => settings.scripts.noConfirm.abroadItemBuy,
		null,
		null,
		null,
		null,
		() => "Disabled until further notice."
	);
})();

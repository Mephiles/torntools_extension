"use strict";
const BOOK_DESCRIPTIONS = {
	744: "Incr. Str by 5% up to 10m upon completion.",
	745: "Incr. Spd by 5% up to 10m upon completion.",
	746: "Incr. Def by 5% up to 10m upon completion.",
	747: "Incr. Dex by 5% up to 10m upon completion.",
	748: "Incr. all working stats by 5% up to 2.5k each upon completion.",
	749: "Incr. blacklist & friend list by 100 upon completion.",
	750: "Provides a free merit reset upon completion.",
	751: "Removes a large amount of drug addiction upon completion.",
	752: "Provides a passive 25% bonus to all stats (31 days).",
	753: "Provides a passive 100% bonus to Str (31 days).",
	754: "Provides a passive 100% bonus to Def (31 days).",
	755: "Provides a passive 100% bonus to Spd (31 days).",
	756: "Provides a passive 100% bonus to Dex (31 days).",
	757: "Incr. all gym gains by 20% (31 days).",
	758: "Incr. Str gym gains by 30% (31 days).",
	759: "Incr. Def gym gains by 30% (31 days).",
	760: "Incr. Spd gym gains by 30% (31 days).",
	761: "Incr. Dex gym gains by 30% (31 days).",
	762: "Incr. crime skill & crime EXP gain by 25% (31 days).",
	763: "Incr. all EXP gain by 25% (31 days).",
	764: "Decr. all hospital times by 50% (31 days).",
	765: "Decr. all jail times by 50% (31 days).",
	766: "Decr. all travel times by 25% (31 days).",
	767: "Incr. travel items by 10 (31 days).",
	768: "Guaranteed stealth for the next 31 days.",
	769: "Large jail bust & escape boost for the next 31 days.",
	770: "Happiness can regen above maximum (31 days)",
	771: "Doubles contract credit & money rewards (31 days).",
	772: "Incr. city item spawns (31 days).",
	773: "Gain no drug addiction 31 days.",
	774: "Provides +20% energy regen (31 days).",
	775: "Doubles nerve regen (31 days).",
	776: "Doubles happiness regen (31 days).",
	777: "Doubles life regen (31 days).",
	778: "Duke will occasionally retaliate against your attackers (31 days).",
	779: "Decr. all consumable cooldowns by 50% (31 days).",
	780: "Decr. all medical cooldowns by 50% (31 days).",
	781: "Doubles alcohol effects (31 days).",
	782: "Doubles energy drink effects (31 days).",
	783: "Doubles candy effects (31 days).",
	784: "Incr. maximum energy to 250 (31 days)",
	785: "Re-use your last used book (31 days).",
	786: "Boost your employee effectiveness (31 days).",
	787: "Guaranteed escape attempt success (31 days)",
};

(async () => {
	const feature = featureManager.registerFeature(
		"Book Effects beside names",
		"items",
		() => settings.pages.items.bookEffects,
		initialiseAddEffects,
		addEffects,
		removeEffects,
		{
			storage: ["settings.pages.items.bookEffects"],
		},
		async () => {
			await requireElement("[data-category='Book']");
		}
	);

	function initialiseAddEffects() {
		CUSTOM_LISTENERS[EVENT_CHANNELS.ITEM_SWITCH_TAB].push(() => {
			if (feature.enabled()) addEffects();
		});
	}

	function addEffects() {
		document.findAll("[data-category='Book']").forEach((book) => {
			if (book.find(".tt-book-effect")) return;
			book.find(".qty.bold.t-hide").insertAdjacentHTML(
				"afterEnd",
				`<span class="tt-book-effect"> - ${BOOK_DESCRIPTIONS[parseInt(book.dataset.item)]}</span>`
			);
		});
	}

	function removeEffects() {
		document.findAll(".tt-book-effect").forEach((x) => x.remove());
	}
})();

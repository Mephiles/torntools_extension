"use strict";

(async () => {
	if (!isFlying() && !isAbroad()) return;

	featureManager.registerFeature(
		"Computer Link",
		"global",
		() => settings.pages.travel.computer,
		null,
		showComputer,
		removeComputer,
		{
			storage: ["settings.pages.travel.computer"],
		},
		async () => {
			if (!document.find("#top-page-links-list")) return "No icon bar present.";
			else if (document.find("#top-page-links-list > .laptop")) return "Already has a laptop.";
			else if (hasAPIData() && settings.apiUsage.user.inventory && !findItemsInObject(userdata.inventory, { ID: 61 }, { single: true }))
				return "No computer found!";

			await checkDevice();
		}
	);

	async function showComputer() {
		await requireContent();
		if (document.find("#top-page-links-list > .tt-computer")) return;

		document.find("#top-page-links-list").insertBefore(
			document.newElement({
				type: "a",
				class: "tt-computer",
				html: `
					<span class="icon-wrap svg-icon-wrap">
						<span class="link-icon-svg laptop">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 16">
								<defs>
									<style>.cls-1{opacity:0.35;}.cls-2{fill:#fff;}.cls-3{fill:#777;}</style>
								</defs>
								<g>
									<g id="icons">
										<g class="cls-1">
											<path class="cls-2" d="M0,1,1,5H17l1-4ZM15.6,6H2.4A1.4,1.4,0,0,0,1,7.4v7.2A1.4,1.4,0,0,0,2.4,16H15.6A1.4,1.4,0,0,0,17,14.6V7.4A1.4,1.4,0,0,0,15.6,6ZM10,7h2V9H10Zm3,3v2H11V10ZM7,7H9V9H7Zm3,3v2H8V10ZM4,7H6V9H4Zm3,3v2H5V10ZM2,7H3V9H2Zm0,3H4v2H2Zm1,5H2V13H3Zm11,0H4V13H14Zm2,0H15V13h1Zm0-3H14V10h2Zm0-3H13V7h3Z"></path>
										</g>
										<path class="cls-3" d="M0,0,1,4H17l1-4ZM15.6,5H2.4A1.4,1.4,0,0,0,1,6.4v7.2A1.4,1.4,0,0,0,2.4,15H15.6A1.4,1.4,0,0,0,17,13.6V6.4A1.4,1.4,0,0,0,15.6,5ZM10,6h2V8H10Zm3,3v2H11V9ZM7,6H9V8H7Zm3,3v2H8V9ZM4,6H6V8H4ZM7,9v2H5V9ZM2,6H3V8H2ZM2,9H4v2H2Zm1,5H2V12H3Zm11,0H4V12H14Zm2,0H15V12h1Zm0-3H14V9h2Zm0-3H13V6h3Z"></path>
									</g>
								</g>
							</svg>
						</span>
					</span>
					${mobile ? "" : "<span id='pc'>Computer</span>"}
				`,
				attributes: {
					role: "button",
					"aria-labelledby": "computer",
					href: "pc.php",
				},
			}),
			document.find("#top-page-links-list > .events")
		);
	}

	function removeComputer() {
		const link = document.find(".tt-computer");
		if (link) link.remove();
	}
})();

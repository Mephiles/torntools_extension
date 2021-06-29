"use strict";

(async () => {
	featureManager.registerFeature("Item No Confirm", "no confirm", () => settings.scripts.noConfirm.itemEquip, injectAdjustments, null, null, null, null);

	function injectAdjustments() {
		injectXHR();

		document.head.appendChild(
			document.newElement({
				type: "script",
				attributes: { type: "text/javascript" },
				html: `
					(() => {
						if (typeof xhrSendAdjustments === "undefined") xhrSendAdjustments = {};
						
						xhrSendAdjustments.noconfirm_items = (xhr, body) => {
							if (!body) return body;
		
							const { action, confirm, step, id } = getParams(body);
							if (step !== "actionForm" || action !== "equip" || confirm === 1) return body;
							
							return paramsToBody({
								step,
								confirm: 1,
								action,
								id,
							});
						};
					})();
				`,
			})
		);
	}
})();

"use strict";

(() => {
	if (typeof window.xhrSendAdjustments === "undefined") window.xhrSendAdjustments = {};
	
	window.xhrSendAdjustments.noconfirm_items = (xhr, body) => {
		if (!body) return body;

		const { step, action, confirm } = getParams(body);
		if (step !== "actionForm" || action !== "equip" || confirm === 1) return body;
		
		return paramsToBody({
			...getParams(body),
			confirm: 1,
		});
	};
})();

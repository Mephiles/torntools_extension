import { RUNTIME_INFORMATION } from "@common/utils/context";

// noinspection JSUnusedGlobalSymbols
export default defineUnlistedScript(() => {
	if (typeof RUNTIME_INFORMATION.getWindow().xhrSendAdjustments === "undefined") RUNTIME_INFORMATION.getWindow().xhrSendAdjustments = {};

	function getParams(body: string) {
		const params: { [key: string]: string } = {};

		for (const param of body.split("&")) {
			const split = param.split("=");

			params[split[0]] = split[1];
		}

		return params;
	}

	function paramsToBody(params: { [key: string]: string | number }) {
		const _params = [];

		for (const key in params) {
			_params.push(`${key}=${params[key]}`);
		}

		return _params.join("&");
	}

	RUNTIME_INFORMATION.getWindow().xhrSendAdjustments.noconfirm_items = (_xhr, body) => {
		if (!body) return body;

		const { step, action, confirm } = getParams(body);
		if (step !== "actionForm" || action !== "equip" || confirm === "1") return body;

		return paramsToBody({
			...getParams(body),
			confirm: 1,
		});
	};
});

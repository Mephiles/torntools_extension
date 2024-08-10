"use strict";

(() => {
	interceptXHR("tt-xhr");

	console.log("Script Injected - XHR Interception");
})();

function interceptXHR(channel) {
	const oldXHROpen = window.XMLHttpRequest.prototype.open;
	const oldXHRSend = window.XMLHttpRequest.prototype.send;

	window.XMLHttpRequest.prototype.open = function (method, url) {
		let params = this.params ?? {};

		if (typeof xhrOpenAdjustments === "object") {
			for (const key in xhrOpenAdjustments) {
				if (typeof xhrOpenAdjustments[key] !== "function") continue;

				const adjustments = xhrOpenAdjustments[key]({ ...this }, method, url);

				method = adjustments.method;
				url = adjustments.url;

				params = { ...params, ...(adjustments.params || {}) };
			}
		}

		this.method = method;
		this.url = url;
		this.params = params;

		this.addEventListener("readystatechange", function () {
			if (this.readyState > 3 && this.status === 200) {
				const page = this.responseURL.substring(this.responseURL.indexOf("torn.com/") + "torn.com/".length, this.responseURL.indexOf(".php"));

				let json, uri;
				if (isJsonString(this.response)) json = JSON.parse(this.response);
				else uri = getUrlParams(this.responseURL);

				window.dispatchEvent(
					new CustomEvent(channel, {
						detail: JSON.stringify({
							page,
							json,
							uri,
							xhr: {
								...this,
								response: this.response,
								responseURL: this.responseURL,
							},
						}),
					})
				);
			}
		});

		arguments[0] = method;
		arguments[1] = url;

		return oldXHROpen.apply(this, arguments);
	};
	window.XMLHttpRequest.prototype.send = function (body) {
		this.params = this.params ?? {};
		if (typeof xhrSendAdjustments === "object") {
			for (const key in xhrSendAdjustments) {
				if (typeof xhrSendAdjustments[key] !== "function") continue;

				body = xhrSendAdjustments[key]({ ...this }, body);
			}
		}

		this.requestBody = body;

		arguments[0] = body;

		return oldXHRSend.apply(this, arguments);
	};

	/*
	 * JavaScript Get URL Parameter (https://www.kevinleary.net/javascript-get-url-parameters/)
	 */
	function getUrlParams(url, prop) {
		if (!url) url = location.href;

		const search = decodeURIComponent(url.slice(url.indexOf("?") + 1));
		const definitions = search.split("&");

		const params = {};
		definitions.forEach((val) => {
			const parts = val.split("=", 2);

			params[parts[0]] = parts[1];
		});

		return prop && prop in params ? params[prop] : params;
	}

	// Global functions
	function isJsonString(str) {
		if (!str || str === "") return false;

		try {
			JSON.parse(str);
		} catch (e) {
			return false;
		}
		return true;
	}
}

// noinspection JSUnusedGlobalSymbols
function getParams(body) {
	const params = {};

	for (const param of body.split("&")) {
		const split = param.split("=");

		params[split[0]] = split[1];
	}

	return params;
}

// noinspection JSUnusedGlobalSymbols
function paramsToBody(params) {
	const _params = [];

	for (const key in params) {
		_params.push(key + "=" + params[key]);
	}

	return _params.join("&");
}

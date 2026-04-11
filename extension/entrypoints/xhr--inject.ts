export type XHRDetails = {
	page: string;
	xhr: {
		requestBody: string;
		response: any;
		responseText: string;
		responseURL: string;
	};
} & ({ json: any; uri: undefined } | { uri: { [key: string]: string }; json: undefined });

// noinspection JSUnusedGlobalSymbols
export default defineUnlistedScript(() => {
	interceptXHR("tt-xhr");

	console.log("Script Injected - XHR Interception");

	function interceptXHR(channel: string) {
		const oldXHROpen = window.XMLHttpRequest.prototype.open;
		const oldXHRSend = window.XMLHttpRequest.prototype.send;

		window.XMLHttpRequest.prototype.open = function (method: string, url: string | URL) {
			let params = this["params"] ?? {};

			if ("xhrOpenAdjustments" in window && typeof window.xhrOpenAdjustments === "object") {
				for (const key in window.xhrOpenAdjustments) {
					if (typeof window.xhrOpenAdjustments[key] !== "function") continue;

					const adjustments = window.xhrOpenAdjustments[key]({ ...this }, method, url);

					method = adjustments.method;
					url = adjustments.url;

					params = { ...params, ...(adjustments.params || {}) };
				}
			}

			this["method"] = method;
			this["url"] = url;
			this["params"] = params;

			this.addEventListener("readystatechange", function () {
				if (this.readyState > 3 && this.status === 200) {
					const page = this.responseURL.substring(this.responseURL.indexOf("torn.com/") + "torn.com/".length, this.responseURL.indexOf(".php"));

					let json: any, uri: any;
					if (isJsonString(this.response)) json = JSON.parse(this.response);
					else uri = getUrlParams(this.responseURL);

					window.dispatchEvent(
						new CustomEvent<XHRDetails>(channel, {
							detail: {
								page,
								json,
								uri,
								xhr: {
									// We used to pass the current XHR here as "...this"
									// but not possible due to some change in Chromium.
									// https://stackoverflow.com/a/53914790
									// https://issues.chromium.org/issues/40091619
									requestBody: this["requestBody"],
									response: this.response,
									responseText: this.responseText,
									responseURL: this.responseURL,
								},
							},
						}),
					);
				}
			});

			arguments[0] = method;
			arguments[1] = url;

			return oldXHROpen.apply(this, arguments as any);
		};
		window.XMLHttpRequest.prototype.send = function (body) {
			this["params"] = this["params"] ?? {};
			if ("xhrSendAdjustments" in window && typeof window.xhrSendAdjustments === "object") {
				for (const key in window.xhrSendAdjustments) {
					if (typeof window.xhrSendAdjustments[key] !== "function") continue;

					body = window.xhrSendAdjustments[key]({ ...this }, body);
				}
			}

			this["requestBody"] = body;

			arguments[0] = body;

			return oldXHRSend.apply(this, arguments as any);
		};

		/*
		 * JavaScript Get URL Parameter (https://www.kevinleary.net/javascript-get-url-parameters/)
		 */
		function getUrlParams(url: string | undefined, prop?: string) {
			if (!url) url = location.href;

			const search = decodeURIComponent(url.slice(url.indexOf("?") + 1));
			const definitions = search.split("&");

			const params: { [key: string]: string } = {};
			definitions.forEach((val) => {
				const parts = val.split("=", 2);

				params[parts[0]] = parts[1];
			});

			return prop && prop in params ? params[prop] : params;
		}

		// Global functions
		function isJsonString(str: string) {
			if (!str || str === "") return false;

			try {
				JSON.parse(str);
			} catch {
				return false;
			}
			return true;
		}
	}
});

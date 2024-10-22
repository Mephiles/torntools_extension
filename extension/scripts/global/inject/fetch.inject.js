"use strict";

(() => {
	interceptFetch("tt-fetch");

	console.log("Script Injected - Fetch Interception");
})();

function interceptFetch(channel) {
	const oldFetch = window.fetch;
	window.fetch = function () {
		return new Promise((resolve, reject) => {
			oldFetch
				.apply(this, arguments)
				.then(async (response) => {
					const page = response.url.substring(response.url.indexOf("torn.com/") + "torn.com/".length, response.url.indexOf(".php"));
					let json = {};
					try {
						json = await response.clone().json();
					} catch {}

					let body = null;
					if (arguments.length >= 2) {
						body = arguments[1].body;

						if (typeof body === "object" && body.constructor.name === "FormData") {
							const newBody = {};

							for (const [key, value] of [...body]) {
								if (isIntNumber(value)) newBody[key] = parseFloat(value);
								else newBody[key] = value;
							}

							body = newBody;
						}
					}

					const detail = {
						page,
						json,
						fetch: {
							url: response.url,
							body,
							status: response.status,
						},
					};

					window.dispatchEvent(new CustomEvent(channel, { detail }));

					resolve(response);
				})
				.catch((error) => {
					reject(error);
				});
		});
	};
}

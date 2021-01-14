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
					const json = await response.clone().json();

					const detail = {
						page,
						json,
						fetch: {
							url: response.url,
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

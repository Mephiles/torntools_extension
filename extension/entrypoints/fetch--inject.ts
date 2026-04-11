import { isIntNumber } from "@/utils/common/functions/utilities";

export interface FetchDetails {
	page: string;
	text: string;
	json: undefined | { [key: string]: any };
	fetch: {
		url: string;
		body: any;
		status: number;
	};
}

function interceptFetch(channel: string) {
	const oldFetch = window.fetch;
	(window.fetch as any) = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> =>
		new Promise((resolve, reject) => {
			oldFetch(input, init)
				.then(async (response: Response) => {
					const page = response.url.substring(response.url.indexOf("torn.com/") + "torn.com/".length, response.url.indexOf(".php"));
					let json = {};
					try {
						json = await response.clone().json();
					} catch {}

					let body = null;
					if (init) {
						body = init.body;
						if (body !== null && typeof body === "object" && body?.constructor?.name === "FormData") {
							const newBody: { [key: string]: any } = {};

							for (const [key, value] of [...body]) {
								if (isIntNumber(value)) newBody[key] = parseFloat(value);
								else newBody[key] = value;
							}

							body = newBody;
						}
					}

					const detail: FetchDetails = {
						page,
						json,
						text: await response.clone().text(),
						fetch: {
							url: response.url,
							body,
							status: response.status,
						},
					};

					window.dispatchEvent(new CustomEvent<FetchDetails>(channel, { detail }));

					resolve(response);
				})
				.catch((error: any) => {
					reject(error);
				});
		});
}

// noinspection JSUnusedGlobalSymbols
export default defineUnlistedScript(() => {
	interceptFetch("tt-fetch");

	console.log("Script Injected - Fetch Interception");
});

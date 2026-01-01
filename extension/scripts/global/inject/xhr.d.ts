type XHRDetails = {
	page: string;
	xhr: {
		requestBody: string;
		response: any;
		responseURL: string;
	};
} & ({ json: any; uri: null } | { json: null; uri: { [key: string]: string } });

interface Window {
	xhrOpenAdjustments: { [key: string]: (xhr: XMLHttpRequest, method: string, url: string | URL) => any };
	xhrSendAdjustments: { [key: string]: (xhr: XMLHttpRequest, body: any) => any };
}

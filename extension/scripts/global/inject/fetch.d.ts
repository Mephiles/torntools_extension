interface FetchDetails {
	page: string;
	text: string;
	json: undefined | { [key: string]: any };
	fetch: {
		url: string;
		body: any;
		status: number;
	};
}

interface FetchDetails {
	page: string;
	json: undefined | { [key: string]: any };
	fetch: {
		url: string;
		body: any;
		status: number;
	};
}

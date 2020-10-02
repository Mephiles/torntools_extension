console.log("TT2 - Loading global data.");

chrome = typeof browser !== "undefined" ? browser : chrome;

const DEFAULT_STORAGE = {
	settings: {
		pages: {
			global: {
				alignLeft: true,
			},
		},
	},
};
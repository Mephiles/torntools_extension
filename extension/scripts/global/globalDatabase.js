console.log("TT2 - Loading global database.");

function requireDatabase(attributes) {
	attributes = {
		requireEntry: true,
		...attributes,
	};

	return requireCondition(() => {
		switch (loadingStatus) {
			case LOADING_STATUSES.ENTRY:
				return true;
			case LOADING_STATUSES.LOADED:
				if (!attributes.requireEntry) return true;
				break;
			case LOADING_STATUSES.FAILED:
				return false;
		}
	});
}

let settings;

(async function () {
	loadingStatus = LOADING_STATUSES.LOADING;
	const data = await ttStorage.get();

	settings = data.settings;

	loadingStatus = LOADING_STATUSES.LOADED;
})();
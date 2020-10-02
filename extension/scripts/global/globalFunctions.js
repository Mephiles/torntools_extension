console.log("TT2 - Loading global functions.");

/*
 * Normal functions.
 */

function requireCondition(condition, attributes = {}) {
	attributes = {
		delay: 10,
		limitChecks: -1,
		...attributes,
	};

	return new Promise((resolve, reject) => {
		if (checkResponse()) return;

		let checker = setInterval(function () {
			if (checkResponse()) return clearInterval(checker);

			if (attributes.limitChecks > 0 && attributes.limitChecks <= attributes.counter++) {
				reject("Checking limit reached.");
				return clearInterval(checker);
			}
		}, attributes.delay);

		function checkResponse() {
			const response = condition();

			if (typeof response === "boolean") {
				if (response) resolve();
				else reject();

				return true;
			} else if (response === "object") {
				if (response.status) resolve();
				else reject();

				return true;
			}

			return false;
		}
	});
}
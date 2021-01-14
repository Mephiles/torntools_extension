(function () {
	const doc = document;

	Document.prototype.find = function (type) {
		if (type.indexOf("=") > -1) {
			let key = type.split("=")[0];
			let value = type.split("=")[1];

			for (let element of document.querySelectorAll(key)) {
				// noinspection EqualityComparisonWithCoercionJS
				if (element.innerText == value) {
					return element;
				}
			}

			try {
				this.querySelector(type);
			} catch (err) {
				return undefined;
			}
		}
		return this.querySelector(type);
	};
	Element.prototype.find = function (type) {
		if (type.indexOf("=") > -1) {
			let key = type.split("=")[0];
			let value = type.split("=")[1];

			for (let element of document.querySelectorAll(key)) {
				// noinspection EqualityComparisonWithCoercionJS
				if (element.innerText == value) {
					return element;
				}
			}

			try {
				this.querySelector(type);
			} catch (err) {
				return undefined;
			}
		}
		return this.querySelector(type);
	};

	$(".content-wrapper").off("submit");

	$(".content-wrapper").on("submit", "form", function (event) {
		console.log("TornTools - hijack");

		let loadingPlaceholderContent = `
			<div class="content-title m-bottom10">
				<h4 class="left">Crimes</h4>
				<hr class="page-head-delimiter">
				<div class="clear"></div>
			</div>
		`;

		loadingPlaceholderContent += `<img class="ajax-placeholder" src="/images/v2/main/ajax-loader.gif" alt="loading"/>`;

		let formElement = this;
		const $form = $(formElement);
		if (formElement.isSubmitting) return;
		formElement.isSubmitting = true;
		event.preventDefault();
		const data = $form.serializeArray();
		window.location.hash = "#";
		$(".content-wrapper").html(loadingPlaceholderContent);

		let action = $form.attr("action");
		action = action[0] === "/" ? action.substr(1) : action;
		const urlParamsDelimiter = action.indexOf("?") > -1 ? "&" : "?";
		action += urlParamsDelimiter + "timestamp=" + Date.now();
		ajaxWrapper({
			url: action,
			type: "POST",
			data: data,
			oncomplete: function (response) {
				preventTextSelectionOnDoubleClick({ invokeType: "callback", duration: 500 });
				formElement.isSubmitting = false;

				window.dispatchEvent(new CustomEvent("tt-crime-finished", { detail: { response } }));

				const steps = action.split("?"),
					step = steps[1] ? steps[1].split("=")[1] : "";
				if (step === "docrime2" || step === "docrime4") refreshTopOfSidebar();
				if (animElement) clearTimeout(animElement);
				highlightElement("/" + step + ".php");
			},
			onerror: function (ee) {
				console.error(ee);
			},
		});
	});

	// Torn functions

	console.log("Quick Crime script injected");
})();

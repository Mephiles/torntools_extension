"use strict";

fetch(chrome.runtime.getURL("/vendor/fontawesome/fontawesome.css"))
	.then((response) => response.text())
	.then((css) => {
		css = css.replace(/\.\.\/webfonts\/[^)]+/g, (match) => {
			match = match.substring(2, match.length);

			return chrome.runtime.getURL(`/vendor/fontawesome${match}`);
		});

		const style = document.createElement("style");
		style.classList.add("tt-style")
		style.innerHTML = css;

		new Promise((resolve) => {
			let counter = 0;
			const interval = setInterval(() => {
				if (counter++ > 1000) {
					finish();
					return;
				}

				if (!document.head) return;

				finish();

				function finish() {
					clearInterval(interval);
					resolve();
				}
			});
		})
			.then(() => document.head.appendChild(style));
	});

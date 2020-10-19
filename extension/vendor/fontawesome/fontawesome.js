fetch(chrome.runtime.getURL("/vendor/fontawesome/fontawesome.css"))
	.then((response) => response.text())
	.then((css) => {
		css = css.replace(/\.\.\/webfonts\/[^)]+/g, (match) => {
			match = match.substring(2, match.length);

			return chrome.runtime.getURL(`/vendor/fontawesome${match}`);
		});

		document.find("head").appendChild(document.newElement({ type: "style", html: css }));
	});

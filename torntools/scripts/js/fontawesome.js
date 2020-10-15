fetch(chrome.runtime.getURL("/scripts/libs/fontawesome.css"))
	.then((response) => response.text())
	.then((css) => {
		css = css.replace(/\/scripts\/webfonts\/[^\)]+/g, (match) => {
			return chrome.runtime.getURL(match);
		});

		doc.find("head").appendChild(doc.new({ type: "style", html: css }));
	});

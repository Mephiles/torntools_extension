requireDatabase().then(() => {
	console.log("TT - Properties");
	let observer = new MutationObserver(addPropertyValues);
	observer.observe(doc.find("div#properties-page-wrap"), {childList: true});
	addPropertyValues();
});

function addPropertyValues() {
	let propertyValue = null;
	for (let property of doc.find(".properties-list").children) {
		if (property.find("ul.info") !== null) {
			propertyValue = numberWithCommas(property.find("ul.info").innerText.split("\n")[3].slice(1));
			property.find(".title").innerText += ` ($${propertyValue})`
		};
	};
};
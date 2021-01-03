requireDatabase().then(() => {
	console.log("TT - Education");
	hideCompletedCategories();
});

function hideCompletedCategories() {
	if (window.location.href.indexOf("step=main") > -1) {
		for (let category of doc.find(".education").findAll(".ajax-act")) {
			if (category.find(".bar-green-wrap-white-bg").style.width === "100%") category.style.opacity = "0.2";
		}
	};
};

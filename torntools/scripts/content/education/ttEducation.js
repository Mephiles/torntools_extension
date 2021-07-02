requireDatabase().then(() => {
	console.log("TT - Education");
	let observer = new MutationObserver(hideCompletedCategories);
	observer.observe(doc.find(".content-wrapper.m-left20"), { childList: true });
	hideCompletedCategories();
	requireElement("div.msg.right-round span.bold.hasCountdown").then(() => {
		showEducationCourseOverTime();
	});
});

function hideCompletedCategories() {
	if (window.location.href.includes("step=main")) {
		for (let category of doc.findAll(".education .ajax-act")) {
			if (category.find(".progressbar").style.width === "100%") category.style.opacity = "0.2";
		}
	}
}

function showEducationCourseOverTime() {
	let overDate = formatDateObject(new Date(new Date().setSeconds(userdata.education_timeleft)));
	doc.find("div.msg.right-round span.bold.hasCountdown").insertAdjacentHTML(
		"afterend",
		`<span>&nbsp;<b>(${overDate.formattedDate} ${overDate.formattedTime})</b></span>`
	);
}

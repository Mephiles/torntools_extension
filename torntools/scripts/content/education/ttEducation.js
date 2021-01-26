requireDatabase().then(() => {
	console.log("TT - Education");
	let observer = new MutationObserver(hideCompletedCategories);
	observer.observe(doc.find(".content-wrapper.m-left20"), { childList: true });
	hideCompletedCategories();
	showEducationCourseOverTime();
});

function hideCompletedCategories() {
	if (window.location.href.includes("step=main")) {
		for (let category of doc.findAll(".education .ajax-act")) {
			if (category.find(".bar-green-wrap-white-bg").style.width === "100%") category.style.opacity = "0.2";
		}
	}
}

function showEducationCourseOverTime() {
	let overDate = new Date(new Date().setSeconds(userdata.education_timeleft));
	let formattedDate = formatDate([overDate.getDate(), overDate.getMonth() + 1, overDate.getFullYear()], settings.format.date);
	let formattedTime = formatTime([overDate.getHours(), overDate.getMinutes(), overDate.getSeconds()], settings.format.time);
	doc.find("div.msg.right-round span.bold.hasCountdown").insertAdjacentHTML("afterEnd", `<span>&nbsp;<b>(${formattedDate} ${formattedTime})</b></span>`);
}

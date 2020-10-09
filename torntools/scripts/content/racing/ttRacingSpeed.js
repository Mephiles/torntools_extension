// window.addEventListener("load", () => {
// 	console.log("TT - Racing Speed");

// 	chrome.storage.local.get(["settings"], function (data) {
// 		const settings = data.settings;
// 		const show_racing = settings.pages.racing.show;

// 		let done = false;
// 		let updateSpeed;
// 		setInterval(function () {
// 			if (racingView() && raceInProgress()) {
// 				if (!done) {
// 					let track_length = document.querySelector(".drivers-list .track-info-wrap .track-info").getAttribute("data-length"); // miles
// 					let race_length = parseFloat(track_length);

// 					updateSpeed = setInterval(function () {
// 						displaySpeed(race_length);
// 					}, 500);
// 					done = true;
// 				}
// 			} else {
// 				done = false;
// 				clearInterval(updateSpeed);
// 			}
// 		}, 1000);
// 	});
// });

// function displaySpeed(race_length) {
// 	console.log("Track:", race_length);
// 	let racers = document.querySelectorAll("#leaderBoard>li");

// 	for (let racer of racers) {
// 		let first_percentage = racer.querySelector(".time").innerText;
// 		if (first_percentage.indexOf(":") > -1)
// 			continue;
// 		console.log("First:", first_percentage);

// 		setTimeout(function () {
// 			let second_percentage = racer.querySelector(".time").innerText;
// 			if (second_percentage.indexOf(":") > -1)
// 				return;
// 			console.log("Second:", second_percentage);

// 			let difference = parseFloat(second_percentage) - parseFloat(first_percentage);
// 			console.log("DIFFERENCE", difference);

// 			let speed = difference / 10 * race_length * 3600;

// 			// clear last span
// 			racer.querySelector(".name").removeChild(racer.querySelector(".name").lastChild);

// 			// add new span
// 			let span = document.createElement("span");
// 			span.style.color = "green";
// 			span.style.float = "right";
// 			span.innerText = speed.toFixed(0) + " mph";
// 			racer.querySelector(".name").appendChild(span);
// 		}, 1000);
// 	}
// }

// function raceInProgress() {
// 	return !!document.querySelector("#leaderBoard .driver-item .time").innerText;
// }

// function racingView() {
// 	return !!document.querySelector(".drivers-list .track-wrap");
// }

// function flying() {
// 	try {
// 		if (document.querySelector("#skip-to-content").innerText === "Traveling") {
// 			console.log("TT - User Flying");
// 			return true;
// 		}
// 	} catch (err) {
// 	}
// 	return false;
// }

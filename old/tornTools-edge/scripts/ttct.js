window.onload = () => {
	console.log("EXTENSION christmas town");
	(async () => {
		const src = chrome.extension.getURL('scripts/module.js');
		const tools = await import(src);

		tools.initialize();
		// Main(tools);
	})();
	// chrome.storage.local.get(["settings"], function(data){
	// 	if(data["ct"] === "show"){
	// 		settings = data["settings"];
	// 		let o = {}

	// 		var a = setInterval(function(){
	// 			const objects = document.querySelectorAll(".objects-layer .ct-object");
	// 			for(let object of objects){
	// 				let x = object.style.left;
	// 				let y = object.style.top;
	// 				let img = object.children[0].getAttribute("src");

	// 				let coordinates = `${x}, ${y}`;
	// 				if(!o[coordinates]){
	// 					o[coordinates] = img;
	// 				}
	// 			}
	// 			settings["ct-data"] = {...settings["ct-data"], ...o}
	// 			chrome.storage.local.set({"settings": settings}, function(){});
	// 		}, 2000)

	// 		setUpMap();
	// 	} else {
	// 		console.log("CT TURNED OFF");
	// 	}
	// });
}

// function setUpMap(){

// 	setUpWindow();


// 	// UPDATE MAP
// 	var b = setInterval(function(){
// 		chrome.storage.local.get(["settings"], function(data){
// 			settings = data["settings"];
// 			let ct_data = settings["ct-data"];

// 			let userPos = document.querySelector(".position___370Oi").innerText;
// 			let ttPos = document.querySelector("#ttMap #ttHeader #ttPos");
// 			ttPos.innerText = userPos;


// 		});
// 	}, 500);
// }

// function setUpWindow(){
// 	// WINDOW SET UP
// 	let mainFrame = document.querySelector(".content-wrapper");
// 	let div = document.createElement("div");
// 	let header = document.createElement("header");
// 	let pos = document.createElement("span");
// 	let resetPos = document.querySelector(".resetButton___1g2YH");
// 	let title = document.createElement("span");
// 	let gesture = document.querySelector("#makeGesture")

// 	div.id = "ttMap";
// 	div.style.height = "700px";
// 	div.style.marginTop = "10px"
// 	div.style.border = "1px solid black";

// 	header.style.backgroundColor = "#EAF3F7";
// 	header.id = "ttHeader";
// 	header.classList.add("title-wrap");
// 	header.style.fontFamily = "Fjalla one";
// 	header.style.paddingRight = "15px";

// 	title.innerText = "Christmas Town";
// 	title.style.marginLeft = "10px";
// 	title.style.fontSize = "16px";
// 	title.style.color = "rgb(102, 143, 177)";
// 	title.style.fontFamily = "inherit";

// 	pos.id = "ttPos";
// 	pos.style.fontSize = "13px";
// 	pos.style.color = "rgb(102, 143, 177)";
// 	pos.classList.add("position___370Oi");
// 	pos.style.fontFamily = "inherit";

// 	// resetPos.classList.add("resetButton___1g2YH");

// 	header.appendChild(title);
// 	header.appendChild(gesture);
// 	header.appendChild(resetPos);
// 	header.appendChild(pos);
// 	div.appendChild(header);
// 	mainFrame.appendChild(div);

// }
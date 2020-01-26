window.onload = () => {
	console.log("EXTENSION", "forums");
	(async () => {
		var tools = {};

		const sources = {
			mainModel: 'scripts/models/mainModel.js',
			forumsModel: 'scripts/models/forumsModel.js'
		}

		for(let src in sources){
			let funcs = await import(chrome.extension.getURL(sources[src]));
			tools = {...tools, ...funcs}
		}
		tools.initialize();
		Main(tools);
	})();
}

function Main(tools){
	chrome.storage.local.get(["settings"], function(data){
		const forums = data["settings"]["other"]["forums"];
		const firstScrollTop = data["settings"]["other"]["forumsScrollTop"];
		let done = false;

		let mainLoop = setInterval(function(){
			if(done){
				clearInterval(mainLoop);
				let subLoop = setInterval(function(){
					subMain(forums, tools);
				}, 10000)
			} else {
				done = subMain(forums, tools);
				if(done){
					if(firstScrollTop){
						tools.scrollToTop();	
					} else {
						console.log("FIRST SCROLL TOP TURNED OFF")
					}
				}
			}
		}, 1000);
	});
}

function subMain(forums, tools){
	// INPUT FRAME
	const frame = document.querySelector("iframe");
	if(frame){
		if(forums){
			frame.setAttribute("style", `
				height: 700px;
				max-height: 1000px;
				display: block;
				width: 100%;
			`);
			
			// BACK UP ARROW
			if(!document.querySelector("#ttbackUpArrow")){
				let upArrow = document.createElement("div");
				upArrow.setAttribute("style", `
					width: 40px;
					height: 30px;
					background-color: gray;
					font-size: 17px;
					color: white;
					position: fixed;
					top: 20px;
					right: 10px;
					font-weight: 600;
					text-align: center;
					line-height: 30px;
					cursor: pointer;
				`)
				upArrow.innerText = "UP";
				upArrow.id = "ttbackUpArrow";
				
				upArrow.addEventListener("click", function(){
					tools.scrollToTop(true);
				})
				
				document.body.appendChild(upArrow);
			}
		} else {
			console.log("FORUMS HELPER OFF");
		}
		return true;
	}
	return false
}
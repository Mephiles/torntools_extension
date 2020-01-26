window.onload = () => {
	console.log("START values script");
	(async () => {
		var tools = {};

		const sources = {
			mainModel: 'scripts/models/mainModel.js',
			tradeModel: 'scripts/models/tradeModel.js'
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
	chrome.storage.local.get(["itemlist", "settings", "api_key"], function(data){
		const tradecalc = data["settings"]["other"]["tradecalc"];
		const itemlist = data["itemlist"]["items"];
		const api_key = data["api_key"];
		var tradeV = false;

		// CHECK FOR SITE CHANGE
		let checker = setInterval(function(){
			if(tradecalc){
				if(tools.tradeView()){
					if(tradeV === false){
						tradeV = true;
						console.log("CALCULATING")
						subMain(itemlist, api_key, tools);
					}
				} else {
					tradeV = false;
					console.log("NOT IN TRADE VIEW")
				}
			} else {
				console.log("TRADE CALCULATOR TURNED OFF")
			}
		}, 1000);
	});
}

async function subMain(itemlist, api_key, tools){
	const tradeContainer = document.querySelector(".trade-cont");
	const leftSide = document.querySelector(".trade-cont .user.left");
	const rightSide = document.querySelector(".trade-cont .user.right");
	const adds = document.querySelectorAll(".log li div")

	const leftItems = tools.getLeftItemIDs(itemlist);
	const rightItems = tools.getRightItemIDs(itemlist);
	var prices = {}

	if(leftItems){
		await tools.calculateItemsValue(leftItems, api_key).then(data => {
			prices = {...prices, ...data["prices"]}
			tools.displayValue(leftSide, data["value"]);
		})
	}

	if(rightItems){
		await tools.calculateItemsValue(rightItems, api_key, prices).then(data => {
			prices = {...prices, ...data["prices"]}
			tools.displayValue(rightSide, data["value"]);
		})
	}

	// SHOW VALUES FOR INDEPENDENT ADDS
	for(let add of adds){
		let text = add.innerText
		if(text.indexOf("added") > -1){
			
			// remove unwanted parts
			text = text.replace(/ added/g, "")
			text = text.replace(/ to the trade./g, "")
			text = text.replace(text.split(" ")[0] + " ", "")
			var items = text.split(", ");

			var resultItems = {}

			for(let item of items){
				let name = item.split(" x")[0];
				let q = item.split(" x")[1];
				let id;

				for(let i in itemlist){
					if(itemlist[i]["name"] === name){
						resultItems[i] = q;
					}
				}
			}

			if(Object.keys(resultItems).length){
				await tools.calculateItemsValue(resultItems, api_key, prices).then(data => {
					tools.displayLogValue(add, data["value"]);
				});
			}
		}
	}
}
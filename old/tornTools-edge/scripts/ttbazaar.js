window.onload = () => {
	console.log("EXTENSION bazaar");
	(async () => {
		var tools = {};

		const sources = {
			mainModel: 'scripts/models/mainModel.js',
			bazaarModel: 'scripts/models/bazaarModel.js'
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
		const settings = data["settings"];
		const showBazaar = settings["other"]["bazaar"];
		const itemlist = data["itemlist"]["items"];
		const api_key = data["api_key"];
		var itemPrices = {}
		var addV = false;

		// CHECK FOR SITE CHANGE
		let checker = setInterval(function(){
			if(showBazaar){
				if(tools.addView()){
					if(addV === false){
						tools.setAppStatus("notready");
						addV = true;
						subMain(itemlist, api_key, itemPrices, tools);
					}
				} else {
					addV = false;
					console.log("NOT IN ADD VIEW")
				}
			} else {
				console.log("BAZAAR HELPER TURNED OFF")
			}
		}, 1000);
	});
}

function subMain(itemlist, api_key, itemPrices, tools){
	var initialCount;

	setTimeout(function(){}, 500) // WAIT FOR INPUTS
	const inputs = document.querySelectorAll("input[placeholder='Qty']");
	if(inputs.length > 0){
		for(let input of inputs){
			input.addEventListener("focus", function(){
				tools.modifyItem(this, itemlist, api_key, itemPrices);	
			});
		}
		tools.setAppStatus("ready");
	}
	initialCount = tools.openAllItems();
	var checkCounter = 0;

	let b = setInterval(function(){
		var checkboxes = document.querySelectorAll("a[role='presentation']");
		if(checkboxes.length > initialCount || checkCounter > 5){
			for(let box of checkboxes){
				box.addEventListener("click", function(){
					tools.modifyItem(this, itemlist, api_key, itemPrices)
				})
			}
			console.log("WAITING FOR INPUTS")
			clearInterval(b);
		}
		checkCounter += 1;
	}, 500)
}
window.onload = () => {
	console.log("EXTENSION auction");
	(async () => {
		var tools = {};

		const sources = {
			mainModel: 'scripts/models/mainModel.js',
			auctionModel: 'scripts/models/auctionModel.js'
		}

		for(let src in sources){
			let funcs = await import(chrome.extension.getURL(sources[src]));
			tools = {...tools, ...funcs}
		}
		// const mainModelSrc = chrome.extension.getURL();
		// const src = chrome.extension.getURL();
		// const tools = await import(src);
		tools.initialize();
		Main(tools);
	})();
}

function Main(tools){
	chrome.storage.local.get(["settings"], function(data){
		const settings = data["settings"];
		const auc = settings["other"]["auction"];

		if(auc){
			tools.setUpAuctionWindow();
			var initialCount;

			// OPEN ALL TABS
			initialCount = tools.openAllAuctionTabs();
			
			let b = setInterval(function(){
				var listings = document.querySelectorAll(".items-list.t-blue-cont.h li");
				if(listings.length > initialCount){
					for(let item of listings){
						for(let clas of item.classList){
							if(clas === "bg-blue"){
								tools.addAuctionListing(item);
							}
						}
					}
					clearInterval(b);
				}
			}, 500)
		} else {
			console.log("AUCTIONS TURNED OFF");
		}
	});
}
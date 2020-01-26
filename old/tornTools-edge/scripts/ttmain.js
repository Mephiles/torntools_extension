const links = {
	networth: "https://api.torn.com/user/?selections=networth"
}

window.onload = () => {
	console.log("EXTENSION", "index");
	(async () => {
		var tools = {};

		const sources = {
			mainModel: 'scripts/models/mainModel.js',
			achievementsModel: 'scripts/models/achievementsModel.js'
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
	chrome.storage.local.get(["settings", "userdata", "torndata", "api_key"], function(data){
		const settings = data["settings"];
		const ach = settings["other"]["achievements"];
		const api_key = data["api_key"];

		const networth = settings["other"]["networth"];
		if(networth){
			tools.get_api(links.networth, api_key)
			.then(data => {
				const value = data["networth"]["total"];
				tools.displayNetworth(parseInt(value));
			});
		}
		
		if(ach){
			const completed = settings["other"]["completed"];
			const stats = data["userdata"];
			const honors = data["torndata"]["honors"];

			const ps = stats["personalstats"];
			const perks = [
				stats["company_perks"],
				stats["education_perks"],
				stats["enhancer_perks"],
				stats["faction_perks"],
				stats["job_perks"],
				stats["merit_perks"],
				stats["property_perks"],
				stats["stock_perks"]
			]
			const status = tools.getStatus();
			if(status === "flying"){
				throw "FLYING";
			}

			// CREATE WINDOW
			window_ = tools.createAwardsWindow();

			console.log('Stats retrieved', data);
				
			var items = {
				"Perks": {stats: tools.countPerks(perks), ach: []},
				"Awards": {stats: stats["awards"], ach: []},
				"Married": {stats: stats["married"]["duration"], ach: []},
				"Points sold": {stats: ps["pointssold"], ach: []},
				"Activity": {stats: tools.hours(ps["useractivity"]), ach: []},
				"Bazaar buyers": {stats: ps["bazaarcustomers"], ach:[]}
			}

			items = tools.setItemHonors(items, honors);

			console.log("ITEMS", items)
			
			tools.appendItems(items, window_.inner_content, completed);
			tools.setAwardsWindow(window_, status);
		} else {
			console.log("ACHIEVEMENTS TURNED OFF")
		}
	})
}
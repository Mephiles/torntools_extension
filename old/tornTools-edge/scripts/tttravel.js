window.onload = () => {
	console.log("EXTENSION", "travel");
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
	chrome.storage.local.get(["settings", "userdata", "torndata"], function(data){
		const settings = data["settings"];
		const ach = settings["other"]["achievements"]
		
		if(ach){
			const completed = settings["other"]["completed"];
			const stats = data["userdata"];
			const honors = data["torndata"]["honors"];

			const ps = stats["personalstats"]
			const status = tools.getStatus()

			// CREATE WINDOW
			window_ = tools.createAwardsWindow();
			
			console.log('Stats retrieved', stats);
			console.log("Honors retrieved", honors);

			var items = {
				"Argentina": {stats: ps["argtravel"], ach: []},
				"Canada": {stats: ps["cantravel"], ach: []},
				"Cayman": {stats: ps["caytravel"], ach: []},
				"China": {stats: ps["chitravel"], ach: []},
				"Dubai": {stats: ps["dubtravel"], ach: []},
				"Hawaii": {stats: ps["hawtravel"], ach: []},
				"Japan": {stats: ps["japtravel"], ach: []},
				"UK": {stats: ps["lontravel"], ach: [], alt: ["Kingdom"]},
				"Mexico": {stats: ps["mextravel"], ach: []},
				"South Africa": {stats: ps["soutravel"], ach: []},
				"Switzerland": {stats: ps["switravel"], ach: []},
				"Total": {stats: ps["traveltimes"], ach: [], alt: ["Travel"], excl: ["to"]},
				"Time": {stats: tools.days(ps["traveltime"]), ach: [], alt: ["Spend"], incl: ["days", "air"]},
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
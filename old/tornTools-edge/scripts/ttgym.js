window.onload = () => {
	console.log("EXTENSION", "gym");
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

			const ps = stats;
			const status = tools.getStatus()

			// CREATE WINDOW
			window_ = tools.createAwardsWindow();

			var items = {
				"Str": {stats: tools.cleanNr(ps["strength"]), ach: [], alt: ["Strength"], incl: ["gain"]},
				"Def": {stats: tools.cleanNr(ps["defense"]), ach: [], alt: ["Defense"], incl: ["gain"]},
				"Spe": {stats: tools.cleanNr(ps["speed"]), ach: [], alt: ["Speed"], incl: ["gain"]},
				"Dex": {stats: tools.cleanNr(ps["dexterity"]), ach: [], alt: ["Dexterity"], incl: ["gain"]},
				"Total": {stats: tools.cleanNr(ps["total"]), ach: [], incl: ["stats"]}
			}

			items = tools.setItemHonors(items, honors);
			tools.appendItems(items, window_.inner_content, completed);
			tools.setAwardsWindow(window_, status);
		} else {
			console.log("ACHIEVEMENTS TURNED OFF")
		}
	})
}
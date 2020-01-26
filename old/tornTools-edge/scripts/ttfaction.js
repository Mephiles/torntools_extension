window.onload = () => {
	console.log("EXTENSION", "faction");
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

			const ps = stats["personalstats"];
			const status = tools.getStatus()

			// CREATE WINDOW
			window_ = tools.createAwardsWindow();
							
			var items = {
				"Organised crimes": {stats: ps["organisedcrimes"], ach: []}
			}

			items = tools.setItemHonors(items, honors);
			tools.appendItems(items, window_.inner_content, completed);
			tools.setAwardsWindow(window_, status);
		} else {
			console.log("ACHIEVEMENTS TURNED OFF")
		}
	});
}

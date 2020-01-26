window.onload = () => {
	console.log("EXTENSION", "items");
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
		const ach = settings["other"]["achievements"];
		
		if(ach){
			const completed = settings["other"]["completed"];
			const stats = data["userdata"];
			const honors = data["torndata"]["honors"];

			const ps = stats["personalstats"]
			const status = tools.getStatus()

			// CREATE WINDOW
			window_ = tools.createAwardsWindow();

			var items = {
				"Cannabis": {stats: ps["cantaken"], ach: []},
				"Ecstasy": {stats: ps["exttaken"], ach: []},
				"Ketamine": {stats: ps["kettaken"], ach: []},
				"LSD": {stats: ps["lsdtaken"], ach: []},
				"Opium": {stats: ps["opitaken"], ach: []},
				"Shrooms": {stats: ps["shrtaken"], ach: []},
				"Speed": {stats: ps["spetaken"], ach: [], excl: ["gain"]},
				"PCP": {stats: ps["pcptaken"], ach: []},
				"Xanax": {stats: ps["xantaken"], ach: []},
				"Vicodin": {stats: ps["victaken"], ach: []},
				"Viruses": {stats: ps["virusescoded"], ach: []},
				"Blood": {stats: ps["bloodwithdrawn"], ach: []},
				"City finds": {stats: ps["cityfinds"], ach: [], excl: ["bank", "restore"]},
				"Dump finds": {stats: ps["dumpfinds"], ach: []},
				"Items dumped": {stats: ps["itemsdumped"], ach: [], incl: ["trash"]},
				"Alcohol": {stats: ps["alcoholused"], ach: []},
				"Candy": {stats: ps["candyused"], ach: []},
				"Medical items": {stats: ps["medicalitemsused"], ach: [], excl: ["steal"]},
				"Energy drinks": {stats: ps["cantaken"], ach: [], alt: ["Energy"], incl: ["cans"]}//,
				//"Books": {stats: ps["booksread"], ach: []}
			}

			items = tools.setItemHonors(items, honors);
			tools.appendItems(items, window_.inner_content, completed);
			tools.setAwardsWindow(window_, status);
		} else {
			console.log("ACHIEVEMENTS TURNED OFF")
		}
	})
}
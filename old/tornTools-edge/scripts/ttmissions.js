window.onload = () => {
	console.log("EXTENSION", "missions");
	(async () => {
		var tools = {};

		const sources = {
			mainModel: 'scripts/models/mainModel.js',
			achievementsModel: 'scripts/models/achievementsModel.js',
			missionsModel: 'scripts/models/missionsModel.js'
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
		const missionValues = settings["other"]["missionValues"];
		const api_key = data["api_key"];
		
		if(ach){
			console.log("ACHIEVEMENTS");
			const completed = settings["other"]["completed"];
			const stats = data["userdata"];
			const honors = data["torndata"]["honors"];

			const ps = stats["personalstats"]
			const status = tools.getStatus()
			
			// CREATE WINDOW
			window_ = tools.createAwardsWindow();

			var items = {
				"Stalemates": {stats: ps["defendsstalemated"], ach: []},
				"Stealthed": {stats: ps["attacksstealthed"], ach: []},
				"Attacks won": {stats: ps["attackswon"], ach: [], incl: ["win"]},
				"Defends won": {stats: ps["defendswon"], ach: [], incl: ["win"]},
				"Assist": {stats: ps["attacksassisted"], ach: []},
				"Critical hits": {stats: ps["attackcriticalhits"], ach: []},
				"Current streak": {stats: ps["killstreak"], ach: [], alt: ["###"]},
				"Best streak": {stats: ps["bestkillstreak"], ach: [], alt: ["Killstreak"]},
				"Rounds fired": {stats: ps["roundsfired"], ach: []},
				"Axe hits": {stats: ps["axehits"], ach: []},
				"Pistol hits": {stats: ps["pishits"], ach: []},
				"Rifle hits": {stats: ps["rifhits"], ach: []},
				"Shotgun hits": {stats: ps["shohits"], ach: []},
				"Piercing hits": {stats: ps["piehits"], ach: []},
				"Heavy hits": {stats: ps["heahits"], ach: []},
				"SMG hits": {stats: ps["smghits"], ach: []},
				"Machine gun hits": {stats: ps["machits"], ach: [], incl: ["guns"]},
				"Fists or kick hits": {stats: ps["h2hhits"], ach: []},
				"Mechanical hits": {stats: ps["chahits"], ach: []},
				"Temporary hits": {stats: ps["grehits"], ach: []}
			}

			items = tools.setItemHonors(items, honors);
			tools.appendItems(items, window_.inner_content, completed);
			tools.setAwardsWindow(window_, status);
		} else {
			console.log("ACHIEVEMENTS TURNED OFF")
		}

		if(missionValues){
			console.log("MISSION REWARD VALUES")
			const rewards = document.querySelectorAll(".rewards-list li");
			const userPoints = parseInt(document.querySelector(".total-mission-points").innerText);

			for(let reward of rewards){
				// console.log("REWARD", reward)
				let data = JSON.parse(reward.getAttribute("data-ammo-info"))
				let name = data["name"];
				let quantity = parseInt(data["amount"]);
				let points = parseInt(data["points"]);
				let id = parseInt(data["image"]);
				let counter = parseInt(data["id"]);

				let act_wrap = document.querySelector(`ul.rewards-list li:nth-child(${counter+1}) .act-wrap`)
				act_wrap.style.boxSizing = "border-box";
				act_wrap.style.borderColor = "black";
				act_wrap.style.borderImage = "none";

				// MAKE THE PRICE RED IF NOT ENOUGH POINTS
				if(userPoints < points){
					act_wrap.style.borderTop = "1px solid red";
				} else {
					act_wrap.style.borderTop = "1px solid #2ef42e";
				}

				if(!id){continue}

				tools.displayMissionPrice(reward, id, quantity, points, api_key, userPoints);
			}
		} else {
			console.log("MISSION REWARD VALUES TURNED OFF")
		}
	})
}
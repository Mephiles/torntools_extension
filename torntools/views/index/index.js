window.addEventListener("load", function(){
	console.log("Start Index");

	local_storage.get(["api_key", "settings"], function([api_key, settings]){
		if(api_key){
			console.log("Loading next window");
			// Change window
			window.location.href = `../${settings.tabs.default}/${settings.tabs.default}.html`;
		} else {
			doc.find("#set-button").addEventListener("click", function(){
				api_key = doc.find("#api-field").value;
	
				local_storage.set({"api_key": api_key}, function(){
					console.log("API key set");
	
					doc.find("h3").innerText = "Please wait up to 1 minute to fetch your data from Torn";
					doc.find("p").innerText = "(you may close this window)";
					doc.find("input").style.display = "none";
                    doc.find("button").style.display = "none";
                    
                    Main_15_minutes(); // 1 request
                    setTimeout(Main_1_day, 5*1000); // 2 requests
				});
			});
		}
	});
});


const doc = document;
Document.prototype.find = function (type) {
    if (type.indexOf("=") > -1) {
        let key = type.split("=")[0];
        let value = type.split("=")[1];

        for (let element of document.querySelectorAll(key)) {
            if (element.innerText == value) {
                return element;
            }
        }

        try {
            this.querySelector(type)
        } catch(err){
            return undefined;
        }
    }
    return this.querySelector(type);
}

const local_storage = {
    get: function (key, callback) {
        let promise = new Promise(function (resolve, reject) {
            if (Array.isArray(key)) {
                let arr = [];
                chrome.storage.local.get(key, function (data) {
                    for (let item of key) {
                        arr.push(data[item]);
                    }
                    return resolve(arr);
                });
            } else if (key == null) {
                chrome.storage.local.get(null, function (data) {
                    return resolve(data);
                });
            } else {
                chrome.storage.local.get([key], function (data) {
                    return resolve(data[key]);
                });
            }
        });

        promise.then(function (data) {
            callback(data);
        });
    },
    set: function (object, callback) {
        chrome.storage.local.set(object, function () {
            callback ? callback() : null;
        });
    },
    change: function (keys_to_change, callback) {
        for(let top_level_key of Object.keys(keys_to_change)){
            chrome.storage.local.get(top_level_key, function (data) {
                let database = data[top_level_key];
                database = recursive(database, keys_to_change[top_level_key]);
    
                function recursive(parent, keys_to_change){
                    for(let key in keys_to_change){
                        if(key in parent && typeof keys_to_change[key] == "object" && !Array.isArray(keys_to_change[key])){
                            parent[key] = recursive(parent[key], keys_to_change[key]);
                        } else {
                            parent[key] = keys_to_change[key];
                        }
                    }
                    return parent;
                }
    
                chrome.storage.local.set({[top_level_key]: database}, function () {
                    callback ? callback() : null;
                });
            });
        }
    },
    clear: function (callback) {
        chrome.storage.local.clear(function () {
            callback ? callback() : null;
        });
    },
    reset: function (callback) {
        chrome.storage.local.get(["api_key"], function (data) {
            let api_key = data.api_key;
            chrome.storage.local.clear(function () {
                chrome.storage.local.set(STORAGE, function () {
                    chrome.storage.local.set({
                        "api_key": api_key
                    }, function () {
                        chrome.storage.local.get(null, function (data) {
                            console.log("Storage cleared");
                            console.log("New storage", data);
                            callback ? callback() : null;
                        });
                    });
                });
            });
        });
    }
}

function Main_15_minutes(){
	local_storage.get("api_key", async function(api_key){
		console.group("Main (stocks)");

		if(api_key == undefined){
			console.log("NO API KEY");
			return;
		}
	
		await new Promise(function(resolve, reject){
			get_api("https://api.torn.com/torn/?selections=stocks", api_key).then((stocks) => {
				if(!stocks.ok) return resolve(false);
		
				stocks = {...stocks.result.stocks};

				let new_date = (new Date()).toString();
				stocks.date = new_date;
		
				local_storage.change({"torndata": {"stocks": stocks}}, function(){
					console.log("Stocks info updated.");
					return resolve(true);
				});
			});
		});
	
		console.groupEnd("Main (stocks)");
	});
}

async function Main_1_day(){
	local_storage.get("api_key", async function(api_key){
		console.group("Main (torndata | OC info | installed extensions)");

		if(api_key == undefined){
			console.log("NO API KEY");
			return;
		}

		// torndata
		console.log("Setting up torndata.")
		await new Promise(function(resolve, reject){
			get_api("https://api.torn.com/torn/?selections=honors,medals,items,pawnshop", api_key).then((torndata) => {
				if(!torndata.ok) return resolve(false);
		
				torndata = torndata.result;
				let itemlist = {items: {...torndata.items}, date: (new Date).toString()};
				delete torndata.items;

				let new_date = (new Date()).toString();
				torndata.date = new_date;
		
				local_storage.get("torndata", function(old_torndata){
					torndata.stocks = old_torndata.stocks;
					
					local_storage.set({"torndata": torndata, "itemlist": itemlist}, function(){
						console.log("	Torndata info updated.");
						console.log("	Itemlist info updated.");
						return resolve(true);
					});
				});
			});
		});

		// faction data
		console.log("Setting up faction data.");
		if(settings.pages.faction.oc_time){
			await new Promise(function(resolve, reject){
				get_api("https://api.torn.com/faction/?selections=crimes", api_key).then((factiondata) => {
					if(!factiondata.ok) return resolve(false);

					factiondata = factiondata.result;

					let new_date = (new Date()).toString();
					factiondata.crimes.date = new_date;

					local_storage.set({"oc": factiondata.crimes}, function(){
						console.log("	Faction data set.");
						return resolve(true);
					});
				});
			});
		} else {
			console.log("	Faction OC time formatting turned off.");
		}

		// Doctorn
		console.log("Checking for installed extensions.");
		await (function(){
			return new Promise(function(resolve, reject){
				local_storage.get("extensions", async function(extensions){
					if(typeof extensions.doctorn == "string" && extensions.doctorn.indexOf("force") > -1){
						return;
					}

					if(usingChrome()){
						let doctorn_installed = await detectExtension("doctorn");
						console.log("	Doctorn installed:", doctorn_installed);
						
						local_storage.change({"extensions": {"doctorn": doctorn_installed}}, function(){
							return resolve(true);
						});
					} else {
						console.log("	Using Firefox.");
					}
				});
			});
		})();

		console.groupEnd("Main (torndata | OC info | installed extensions)");
	});
}

function get_api(http, api_key) {
    return new Promise(async function(resolve, reject){
        try {
            const response = await fetch(http + "&key=" + api_key);
            const result = await response.json();
    
            if (result.error) {
                if(result.error.code == 9){  // API offline
                    console.log("API SYSTEM OFFLINE");
                    setBadge("error");
                    
                    local_storage.change({"api": { "online": false, "error": result.error.error }}, function(){
                        return resolve({ok: false, error: result.error.error});
                    });
                } else {
                    console.log("API ERROR:", result.error.error);
    
                    local_storage.change({"api": { "online": true, "error": result.error.error }}, function(){
                        return resolve({ok: false, error: result.error.error});
                    });
                }
            } else {
                try {
                    if(isNaN(await getBadgeText())){
                        setBadge("");
                    }
                } catch(err){console.log("Unable to get Badge.")}
                local_storage.change({"api": { "online": true, "error": "" }}, function(){
                    return resolve({ok: true, result: result});
                });
            }
        } catch(err){
            console.log("Error Fetching API", err);
        }
    });
}
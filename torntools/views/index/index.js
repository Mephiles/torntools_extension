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
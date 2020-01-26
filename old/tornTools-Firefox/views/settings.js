const changeLog = {
	"v1.9": {
		"New Features": [
			"City Find - shows items in city view and also the total price (Item List is hidden when using DocTorn - total price is still shown) - (Thanks Tos :))",
			"Added a few new achievements. (missions - total hits, largest mug, slashing hits)",
			"Multiple channels for Faction chat - disabled by default (learn more about it below - under Settings)",
			"Awards sections now show last fetch time",
			"Implemented API system fail check - data is not overwritten with errors anymore."
		],
		"Fixes": [
			"Fixed issue where TornTools area wasn't shown anywhere else than desktop PCs.",
			"Made forum boxes smaller a bit.",
			"Fixed '/undefined' in mission achievements (killstreak)",
			"Removed achievement for 'Energy cans taken' as it was showing false info. Will add back when API shows stats for it."
		],
		"Extras": [
			"When going to api.torn.com then the api key field is automatically filled with user's api key.",
			"When You find that api shows stats for some achievement that I have not displayed then please let me know :)",
			"Also added code to github if anyone is interested - https://github.com/Mephiles/tornTools"
		]
	},
	"v1.8": {
		"New Features": [
			"Added option to make Mail text box bigger. (both when composing and replying to a mail)",
			"Added option to notify of Vicodin in bazaars that are priced over 100k. (I think you know why ;), price might be changed if for some reason Vicodin gets more expensive in the future)",
			"Bazaar helper now also shows the lowest price on market when managing items in your bazaar. (On both occasions look for the green checkmark - in case you don't see it or see a red cross: a reload might help. If not then check your settings. If still not then let me know!)",
			"As suggested by a user - a sub-tab is added to Stocks where you can add different stocks (permanently until removed) and see their benefits (and stock amounts needed/already owned)."
		],
		"Fixes": [
			"TornTools link is now only shown under Areas when an update is installed. Settings can still be accessed by the 'wheel' when opening extension window.",
			"Added back info about API requests - be sure to see what will make one!"
		],
		"API REQUEST - IMPORTANT": [
			"--GREATLY REDUCED API REQUEST AMOUNTS--",
			"Trade Calculator makes no requests anymore.",
			"Mission values makes no requests anymore.",
			"Networth on Home site makes no requests anymore.",
			"LEARN MORE FROM API REQUEST INFO DOWN BELOW"
		],
		"Extras": [
			"I do NOT encourage signing up on my site yet as it is still 'under construction' and databases might be dropped quite frequently (meaning your user info will be lost). I will notify of future developments.",
			"Also any ideas are welcome (or if you want something personal made for you on my site?).",
			"Also also.. As you might have noticed - my 'designing' skills aren't the best (I'm okay with what I have right now but everything can be improved, right?) so hit me up if You want to help out, site design, logos, banners etc."
		]
	},
	"v1.7.1": {
		"New Features": [
			"Added some functions for forum pages: 1) Added button that will take you to the top of the page. 2) Increased input box size.",
			"Added option to automatically scroll to the top of forum threads when going to one. (not ideal but works)",
			"Added option to show actual networth (fetched from API - 1-2min delay) on Home page.",
			"Added reset settings button.",
			"Added an area for Torn Tools under Areas - directs to this page. (also notifies of a new version release)",
			"Added indicator if the Bazaar Helper is working as it sometimes fails to load correctly (in case of failure - reloading the page should help)",
			"Please note that when you start adding items to bazaar but you are not on the main tab where all items are present then only the items on the opened tab will be 'watched'. When this occurs just click on 'all items' and refresh the page."
		],
		"Fixes": [
			"Fixed wrong price info on auctions.",
			"Noticed that the same info was shown for Market and Bazaar (prices & quantities) in Market tab. Fixed that."
		],
		"IMPORTANT": [
			"Please note that I removed API limit on trades (temporarily). It will be re-enabled once I figure out some code bugs etc."
		],
		"Extras": [
			"Removed info about API requests amount. (Might add it back with more detailed info in later updates.)",
			"If any users had problem with setting the API key (nothing seemed to happen) - hopefully that is fixed now.",
			"Sorry if that update took a long time: reworked some code into parts so it is easier to add future features. Also holidays.. so.. :)",
			"Also working on making a site for TornTools for databases etc. Also for personal education as this is my first :) - www.torntools.eu"
		]
	},
	"v1.6.2": [
		"Re-enabled bazaar price helper (available from settings - disabled by default to not cause any confusion) !!! Note that it only shows the price as a placeholder and You have to insert the price yourself."
	],
	"v1.6.1": [
		"Added a colored bar that shows if you can afford a mission reward or not."
	],
	"v1.6": [
		"Added option to show mission reward values. (especially useful - one point value)",
		"Searchbars on Market and Calculator tabs auto-focus when opened."
	],
	"v1.5.1": [
		"Temporarily disabled Bazaar Helper as there is a bug with pricing. Patch coming soon!"
	],
	"v1.5": [
		"Added bazaar price helper - auto complete prices (lowest on market)",
		"Added auction helper - show your own auctions all together",
		"Technical: reworked settings section of the extension"
	],
	"v1.4": [
		"Fixed bug where trade values where not displayed in case of 0 items",
		"Added changelog",
		"Removed help section from settings",
		"Reduced api request amount in trade view. Set api limit to 60 requests on trade view."
	]
}

const chrome = browser;

window.onload = () => {
	console.log("START SETTINGS")
	setUpWindow();

	// SET UPDATE TO FALSE
	chrome.storage.local.get(["update", "api_system_online"], function(data){
		if(data["update"] === true){
			chrome.storage.local.set({"update": false},function(){
				console.log("UPDATE SET TO FALSE");
			});
		}

		if(data["api_system_online"] === false){
			document.getElementById("error").innerText = "Api system is down!";
		}
	});
}

function setUpWindow(){
	chrome.storage.local.get(["settings"], function(data){
		const settings = data["settings"]

		modifySettings(settings, false);

		const api_field = document.querySelector("#api-input");
		const api_button = document.querySelector("#change-api");
		const setting_boxes = document.querySelectorAll(".setting");
		const changelog_ul = document.querySelector("#changelog");
		const currentVersion = document.querySelector("#current-version");
		const reset_button = document.querySelector("#settings #reset-button");

		// EVENT LISTENERS
		for(let setting of setting_boxes){
			setting.addEventListener("click", function(){
				modifySettings({}, true);
			})
		}

		// reset api key
		api_button.addEventListener("click", function(){
			let api_key = api_field.value;

			chrome.storage.local.set({"api_key": api_key}, function(){
				console.log("API KEY SET");
				getData(api_key);
			});
		});

		// reset settings
		reset_button.addEventListener("click", function(){
			resetSettings();
		});

		const ver = chrome.runtime.getManifest().version
		currentVersion.innerText = "Current version: " + ver;

		// ADD CHANGELOG
		for(let v in changeLog){
			let mainSection = document.createElement("li");
			let lowerSection = document.createElement("ul");
			mainSection.innerText = v;
			if(v.indexOf(ver) != -1){
				mainSection.style.backgroundColor = "#ffff0240";
			}

			if(Object.keys(changeLog[v])[0] !== "0"){
				for(let sub_section in changeLog[v]){
					let li = document.createElement("li");
					let ul = document.createElement("ul");
					li.innerText = sub_section;

					for(let bug of changeLog[v][sub_section]){
						let li = document.createElement("li");
						li.innerText = bug;
						ul.appendChild(li);
					}
					li.appendChild(ul);
					lowerSection.appendChild(li);
				}
			} else {
				for(let bug of changeLog[v]){
					let li = document.createElement("li");
					li.innerText = bug;
					lowerSection.appendChild(li);	
				}
			}


			mainSection.appendChild(lowerSection);
			changelog_ul.appendChild(mainSection);
		}
	});
}

function modifySettings(settings, apply){
	const references = {
		tabs: document.querySelectorAll("#settings #tabs input"),
		default_window: document.querySelectorAll("#settings #def_windows input"),
		"completed": document.querySelector("#settings #achievements-completed"),
		"tradecalc": document.querySelector("#settings #calculator-trade"),
		"achievements": document.querySelector("#settings #achievements-toggle"),
		"bazaar": document.querySelector("#settings #bazaar-helper"),
		"auction": document.querySelector("#settings #auction-helper"),
		"missionValues": document.querySelector("#settings #mission-values"),
		"forums": document.querySelector("#settings #forums-helper"),
		"forumsScrollTop": document.querySelector("#settings #forums-scroll-top"),
		"networth": document.querySelector("#settings #networth-show"),
		"mail": document.querySelector("#settings #mail-box"),
		"vicodin": document.querySelector("#settings #notify-vicodin"),
		"cityfind": document.querySelector("#settings #city-find"),
		"factionchannels": document.querySelector("#settings #faction-channels")
	}

	if(apply){
		var newSettings = {
			"tabs": [],
			"default_window": "market",
			"other": {
				"achievements": false,
				"completed": false,
				"networth": false,
				"ct": false,
				"bazaar": false,
				"auction": false,
				"missionValues": false,
				"forumsScrollTop": false
			}
		}

		for(let ref in references){
			if(references[ref] === references.tabs){
				for(let check of references.tabs){
					if(check.checked){
						newSettings["tabs"].push(check.value);
					}
				}
			} else if(references[ref] === references.default_window){
				for(let radio of references.default_window){
					if(radio.checked){
						newSettings["default_window"] = radio.nextElementSibling.innerText.toLowerCase();
					}
				}
			} else {
				if(references[ref].checked){
					newSettings["other"][ref] = true;
				}
			}
		}

		console.log("SETTINGS", newSettings)

		chrome.storage.local.set({"settings": newSettings}, function(){
			console.log("SETTINGS SET")
		})
	} else {
		for(let ref in references){
			if(references[ref] === references.tabs){
				// tabs
				for(let check of references.tabs){
					for(let tab of settings["tabs"]){
						if(check.nextElementSibling.innerText.indexOf(tab) > -1){
							check.checked = true;
						}
					}
				}
			} else if(references[ref] === references.default_window){
				// default window
				for(let radio of references.default_window){
					if(radio.nextElementSibling.innerText.toLowerCase() === settings["default_window"]){
						radio.checked = true;
					} else {
						radio.checked = false;
					}
				}
			} else {
				if(settings["other"][ref]){
					references[ref].checked = true;
				} else {
					references[ref].checked = false;
				}
			}
		}
	}
}

function getData(api_key){
	get_api(links.userdata, api_key).then((data) => {
		chrome.storage.local.set({"userdata": data}, function(){
			console.log("Userdata set.")
		});
	})

	get_api(links.torndata, api_key).then((data) => {
		chrome.storage.local.set({"torndata": data}, function(){
			console.log("Torndata set.")
		});
	})

	get_api(links.itemlist, api_key).then((data) => {
		chrome.storage.local.set({"itemlist": data}, function(){
			console.log("Itemlist set.")
		});
	})
}

function getLowest(lists){
	var lowest;

	for(let list of lists){
		for(let id in list){
			let price = parseInt(data[list][id]["cost"]);

			if(!lowest){
				lowest = price;
			} else if(price < lowest){
				lowest = price
			}
		}
	}
	return lowest;
}

async function get_api(http, api_key) {
  	const response = await fetch(http + "&key=" + api_key)
  	return await response.json()
}

function resetSettings(){
	// SET SETTINGS
	const settings = {
		"default_window": "market",
		"tabs": ["market", "stocks", "calculator"],
		"other": {
			"achievements": true,
			"completed": true,
			"tradecalc": true,
			"networth": true,
			"ct": false,
			"bazaar": false,
			"auction": true,
			"missionValues": true,
			"forums": true,
			"forumsScrollTop": true,
			"mail": true,
			"vicodin": true,
			"cityfind": true
		}
	}
	chrome.storage.local.set({"settings": settings}, function(){
		console.log("Settings reset.")
		notification("Settings reset.");
		modifySettings(settings, false);
	});
}

function notification(message){
	$("#message").text(message);
	$("#message").slideDown("slow", function(){});
	setTimeout(function(){
		$("#message").slideUp("slow", function(){});
	}, 2000);
}
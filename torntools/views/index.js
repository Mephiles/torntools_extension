// window.onload = () => {
// 	console.log("START INDEX");

// 	chrome.storage.local.get(["api_key"], function(data){
// 		if(!data["api_key"]){
// 			const apiField = document.querySelector("#api-field");
// 			const setButton = document.querySelector("#set-button");

// 			setButton.addEventListener("click", function(){
// 				let apiKey = apiField.value

// 				chrome.storage.local.set({"api_key": apiKey}, function(){
// 					console.log("API KEY set.");

// 					chrome.runtime.sendMessage({"action": "START"});

// 					setTimeout(function(){
// 						setWindow();
// 					}, 1500);
// 				});
// 			});
// 		} else {
// 			console.log("LOADING WINDOW");
// 			setWindow();
// 		}
// 	});
// }

// function setWindow(){
// 	chrome.storage.local.get(["settings"], function(data){
// 		window.location.href = data.settings.tabs.default + ".html";
// 	});
// }

window.addEventListener("load", function(){
	console.log("Start Index");

	local_storage.get("api_key", function(api_key){
		if(api_key){
			console.log("Loading next Window");
			loadNextWindow();
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

function loadNextWindow(){
	local_storage.get("settings", function(settings){
		window.location.href = settings.tabs.default + ".html";
	});
}
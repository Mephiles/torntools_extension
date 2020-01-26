window.onload = () => {
	console.log("START INDEX");

	chrome.storage.local.get(["api_key"], function(data){
		if(!data["api_key"]){
			const apiField = document.querySelector("#api-field");
			const setButton = document.querySelector("#set-button");

			setButton.addEventListener("click", function(){
				let apiKey = apiField.value

				chrome.storage.local.set({"api_key": apiKey}, function(){
					console.log("API KEY set.");

					chrome.runtime.sendMessage({"action": "START"});

					setTimeout(function(){
						setWindow();
					}, 1500);
				});
			});
		} else {
			console.log("LOADING WINDOW");
			setWindow();
		}
	});
}

function setWindow(){
	chrome.storage.local.get(["settings"], function(data){
		window.location.href = data.settings.tabs.default + ".html";
	});
}
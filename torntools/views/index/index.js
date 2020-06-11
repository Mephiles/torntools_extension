window.addEventListener("load", function(){
	console.log("Start Index");

	DBloaded().then(function(){
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
console.log("TT - API");

chrome.storage.local.get(["api_key"], function(data){
	const api_key = data["api_key"];

	var container = document.querySelector("#api_key");
	if(container){
		container.value = api_key;
	}
	
	let demo_page_checker = setInterval(function(){
		if(isDemoPage()){
			container.focus();
			clearInterval(demo_page_checker);
		}
	}, 1000);
});

function isDemoPage(){
	if(document.querySelector("#demo").style.display !== "none"){
		return true;
	}
	return false;
}
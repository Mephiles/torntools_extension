window.addEventListener('load', (event) => {
	console.log("TT - API");
	
	local_storage.get("api_key", function(api_key){
		doc.find("#api_key").value = api_key;

		let demo_page_checker = setInterval(function(){
			if(document.querySelector("#demo").style.display != "none"){
				doc.find("#api_key").focus();
				clearInterval(demo_page_checker);
			}
		}, 500)
	});
});
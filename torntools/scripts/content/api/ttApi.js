window.addEventListener('load', (event) => {
	console.log("TT - API");
	
	local_storage.get("api_key", function(api_key){
		doc.find("#api_key").value = api_key;

		let demo_page_checker = setInterval(function(){
			if(document.querySelector("#demo").style.display != "none"){
				// apply API key
				doc.find("#api_key").focus();

				// set resonse type to pretty
				for(let type_pretty of doc.findAll("input[value=pretty]")){
					type_pretty.checked=true
				}

				clearInterval(demo_page_checker);
			}
		}, 500)
	});
});
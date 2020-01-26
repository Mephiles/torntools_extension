window.onload = () => {
	(async () => {
		var tools = {};

		const sources = {
			mainModel: 'scripts/models/mainModel.js',
		}

		for(let src in sources){
			let funcs = await import(chrome.extension.getURL(sources[src]));
			tools = {...tools, ...funcs}
		}
		tools.initialize();
		// Main(tools);
	})();
}
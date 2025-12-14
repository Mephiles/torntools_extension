(async () => {
	await loadDatabase();

	if (!settings.pages.api.clickableSelections) return;

	document.body.classList.add("tt-api-selections-clickable");
	await requireElement("p[class*='_fields']");
	document.findAll("p[class*='_fields']").forEach((fields) => {
		fields.addEventListener("click", (event) => {
			const s = window.getSelection();
			let range = s.getRangeAt(0);
			const node = s.anchorNode;

			while (range.startOffset !== 0 && range.toString().indexOf(",") !== 0 && range.toString().indexOf(":") === -1) {
				range.setStart(node, range.startOffset - 1);
			}
			if (range.startOffset !== 0) range.setStart(node, range.startOffset + 1);

			do {
				range.setEnd(node, range.endOffset + 1);
			} while (range.endOffset < node.textContent.length && range.toString().indexOf(",") === -1 && range.toString().trim() !== "");
			const selection = range.toString().replaceAll(",", "").trim();

			const panel = (event.target as Element).closest("div.panel-group");
			const selectionsInput = panel.find<HTMLInputElement>("input[id*=selections]");

			if (event.ctrlKey) {
				if (selectionsInput.value.trim() === "") selectionsInput.value = selection;
				else if (!selectionsInput.value.includes(selection)) selectionsInput.value += "," + selection;
			} else {
				selectionsInput.value = selection;
				panel.find("button").click();
			}
		});
	});
})();

import { loadDatabase, storageListeners } from "@/utils/common/data/database";
import { getPageTheme } from "@/utils/common/functions/pages";

(async () => {
	await loadDatabase();

	document.body.classList.add(getPageTheme());
	storageListeners.settings.push(() => {
		document.body.classList.remove("dark", "light");
		document.body.classList.add(getPageTheme());
	});
})();

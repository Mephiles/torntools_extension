// noinspection JSUnusedGlobalSymbols
export default defineUnlistedScript(() => {
	const originalConfirm = window.confirm;
	window.confirm = (message?: string) => {
		if (!message || message.includes("This link leads outside")) return true;

		return originalConfirm(message);
	};
});

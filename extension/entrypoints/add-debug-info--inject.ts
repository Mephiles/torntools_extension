// noinspection JSUnusedGlobalSymbols
export default defineUnlistedScript(() => {
	// @ts-expect-error Bundling Migration
	$("#editor-wrapper .editor-content.mce-content-body").keyup();
});

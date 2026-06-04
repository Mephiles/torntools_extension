/// <reference lib="webworker" />

export default defineUnlistedScript(() => {
	const worker = self as unknown as ServiceWorkerGlobalScope;

	worker.addEventListener("notificationclick", (event) => {
		// Android doesn't close the notification when you click on it
		// See: http://crbug.com/463146
		event.notification.close();

		if (event.notification.data?.link) {
			const url = event.notification.data.link;

			worker.clients.openWindow(url).then((windowClient) => windowClient?.focus());
		}
	});
});

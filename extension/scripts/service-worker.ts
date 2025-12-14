const globalWorker = globalThis as unknown as ServiceWorkerGlobalScope;
const worker = self as unknown as Worker;

worker.addEventListener("notificationclick", function (event) {
	// Android doesn't close the notification when you click on it
	// See: http://crbug.com/463146
	event.notification.close();

	if (event.notification.data?.link) {
		const url = event.notification.data.link;

		globalWorker.clients.openWindow(url).then((windowClient) => windowClient?.focus());
	}
});

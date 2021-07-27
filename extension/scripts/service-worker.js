"use strict";

self.addEventListener("notificationclick", function (event) {
	// Android doesn't close the notification when you click on it
	// See: http://crbug.com/463146
	event.notification.close();

	if (event.notification.data?.link) {
		const url = event.notification.data.link;

		clients.openWindow(url).then((windowClient) => windowClient?.focus());
	}
});

import { toast } from "svelte-sonner";
import { browser } from "wxt/browser";

export function cantRequestPermissionsToast() {
	if (browser?.runtime?.openOptionsPage) {
		toast.error("There was an issue when requesting additional permissions. Please go to the dedicated settings page.", {
			duration: Number.POSITIVE_INFINITY,
			dismissible: true,
			action: { label: "Visit", onClick: () => browser.runtime.openOptionsPage() },
		});
	} else if (location.href.includes("options.html")) {
		toast.error("There was an issue when requesting additional permissions. Please go to the dedicated settings page.", {
			duration: Number.POSITIVE_INFINITY,
			dismissible: true,
			action: { label: "Visit", onClick: () => window.open(location.href) },
		});
	} else {
		toast.error(
			"There was an issue when requesting additional permissions. Please go to the dedicated settings page. This can be done through our container on the torn settings page or our popup.",
			{
				duration: Number.POSITIVE_INFINITY,
				dismissible: true,
			},
		);
	}
}

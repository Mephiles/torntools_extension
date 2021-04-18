"use strict";

function usingChrome() {
	return navigator.userAgent.includes("Chrome");
}

function usingFirefox() {
	return navigator.userAgent.includes("Firefox");
}

function usingYandex() {
	return navigator.userAgent.includes("YaBrowser");
}

function hasSilentSupport() {
	return !usingFirefox() && (!navigator.userAgent.includes("Mobile Safari") || usingYandex());
}

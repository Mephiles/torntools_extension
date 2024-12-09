"use strict";

const src = chrome.runtime.getURL("/vendor/drag-drop-touch/drag-drop-touch.esm.min.js?autoload")
const x = import(src)
	.then((response) => console.log(response))

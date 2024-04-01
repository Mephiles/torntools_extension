chrome.runtime.onMessage.addListener((msg) => {
	if (msg.offscreen) playAudio(msg);
});

// Play sound with access to DOM APIs
function playAudio({ src, volume }) {
	const audio = new Audio(src);
	audio.volume = volume;
	audio.play();
}

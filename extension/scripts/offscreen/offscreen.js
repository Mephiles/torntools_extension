chrome.runtime.onMessage.addListener((msg) => {
	if (msg.offscreen === "notification") playAudio(msg);
	else if (msg.offscreen === "tts") playTTS(msg);
});

// Play sound with access to DOM APIs
function playAudio({ src, volume }) {
	const audio = new Audio(src);
	audio.volume = volume;
	audio.play();
}

function playTTS({ text, volume }) {
	const ttsMessage = new SpeechSynthesisUtterance(text);
	ttsMessage.volume = volume;
	window.speechSynthesis.speak(ttsMessage);
}

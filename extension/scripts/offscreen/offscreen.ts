type OffscreenMessage = ({ offscreen: "notification" } & PlayAudioOptions) | ({ offscreen: "tts" } & PlayTTSOptions);

chrome.runtime.onMessage.addListener((msg: OffscreenMessage) => {
	if (msg.offscreen === "notification") playAudio(msg);
	else if (msg.offscreen === "tts") playTTS(msg);

	return undefined;
});

interface PlayAudioOptions {
	src: string;
	volume: number;
}

// Play sound with access to DOM APIs
function playAudio({ src, volume }: PlayAudioOptions) {
	const audio = new Audio(src);
	audio.volume = volume;
	void audio.play();
}

interface PlayTTSOptions {
	text: string;
	volume: number;
}

function playTTS({ text, volume }: PlayTTSOptions) {
	const ttsMessage = new SpeechSynthesisUtterance(text);
	ttsMessage.volume = volume;
	window.speechSynthesis.speak(ttsMessage);
}

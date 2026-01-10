type OffscreenMessage = ({ offscreen: "audio" } & PlayAudioOptions) | ({ offscreen: "tts" } & PlayTTSOptions);

chrome.runtime.onMessage.addListener((message: OffscreenMessage) => {
	if (message.offscreen === "audio") playAudio(message);
	else if (message.offscreen === "tts") playTTS(message);

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

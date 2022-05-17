function readMessageAloud(message) {
	const ttsMessage = new SpeechSynthesisUtterance(message);

	ttsMessage.volume = settings.notifications.volume / 100;

	window.speechSynthesis.speak(ttsMessage);
}

<script lang="ts">
	let {
		sound,
		volume,
		ttsVoice,
		voices,
		customSoundNotice,
		onSoundChange,
		onVolumeChange,
		onVoiceChange,
		onUpload,
		onPlay,
		onStop,
	}: {
		sound: string;
		volume: number;
		ttsVoice: string;
		voices: Array<{ id: string; name: string }>;
		customSoundNotice: string | null;
		onSoundChange: (value: string) => void;
		onVolumeChange: (value: number) => void;
		onVoiceChange: (value: string) => void;
		onUpload: (event: Event) => void;
		onPlay: () => void;
		onStop: () => void;
	} = $props();

	const showPlayback = $derived(sound !== "mute" && sound !== "default");
</script>

<section class="rounded-3xl border border-border/70 bg-card/85 p-5 shadow-sm">
	<div class="mb-4">
		<h2 class="text-lg font-semibold">Notification Sound</h2>
		<p class="mt-1 text-sm text-muted-foreground">Choose the browser notification sound, preview it, and manage the custom upload.</p>
	</div>

	<div class="grid gap-4 xl:grid-cols-[minmax(0,18rem)_1fr]">
		<div>
			<label class="mb-2 block text-sm font-medium" for="notification-sound-select">Sound effect</label>
			<select
				id="notification-sound-select"
				class="w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm"
				value={sound}
				onchange={(event) => onSoundChange((event.currentTarget as HTMLSelectElement).value)}
			>
				<option value="default">OS default</option>
				<option value="mute">Mute</option>
				<option value="1">Sound 1</option>
				<option value="2">Sound 2</option>
				<option value="3">Sound 3</option>
				<option value="4">Sound 4</option>
				<option value="5">Sound 5</option>
				<option value="custom">Custom</option>
			</select>
			<p class="mt-2 text-xs text-muted-foreground">Mute and OS default might not work the same way in every browser.</p>
		</div>

		<div class="space-y-4">
			{#if showPlayback}
				<div>
					<label class="mb-2 block text-sm font-medium" for="notification-volume">Volume</label>
					<input
						id="notification-volume"
						type="range"
						min="1"
						max="100"
						value={volume}
						class="w-full accent-primary"
						oninput={(event) => onVolumeChange(Number((event.currentTarget as HTMLInputElement).value))}
					/>
					<div class="mt-3 flex gap-2">
						<button type="button" class="rounded-full border border-border bg-background px-3 py-2 text-sm font-medium" onclick={onPlay}>
							Play
						</button>
						<button type="button" class="rounded-full border border-border bg-background px-3 py-2 text-sm font-medium" onclick={onStop}>
							Stop
						</button>
					</div>
				</div>
			{/if}

			{#if sound === "custom"}
				<div class="rounded-2xl border border-dashed border-border bg-background/70 p-4">
					<label class="mb-2 block text-sm font-medium" for="notification-custom-upload">Custom sound file</label>
					<input id="notification-custom-upload" type="file" accept=".mp3,.ogg,.wav" onchange={onUpload} />
					{#if customSoundNotice}
						<p class="mt-2 text-xs text-amber-600 dark:text-amber-400">{customSoundNotice}</p>
					{/if}
				</div>
			{/if}

			<div>
				<label class="mb-2 block text-sm font-medium" for="notification-tts-voice">TTS voice</label>
				<select
					id="notification-tts-voice"
					class="w-full rounded-2xl border border-border bg-background px-3 py-2.5 text-sm"
					value={ttsVoice}
					onchange={(event) => onVoiceChange((event.currentTarget as HTMLSelectElement).value)}
				>
					{#each voices as voice (voice.id)}
						<option value={voice.id}>{voice.name}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>
</section>

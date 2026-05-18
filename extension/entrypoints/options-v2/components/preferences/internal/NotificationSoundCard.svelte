<script lang="ts">
	import { Button } from "@svelte/components/ui/button";
	import * as Field from "@svelte/components/ui/field";
	import { Input } from "@svelte/components/ui/input";
	import { Slider } from "@svelte/components/ui/slider";
	import PlayIcon from "phosphor-svelte/lib/PlayIcon";
	import StopIcon from "phosphor-svelte/lib/StopIcon";
	import { onDestroy, onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import ItemSelect from "@/entrypoints/options-v2/components/preferences/ItemSelect.svelte";
	import PreferenceSectionCard from "@/entrypoints/options-v2/components/preferences/PreferenceSectionCard.svelte";
	import StorageNumber from "@/entrypoints/options-v2/components/preferences/StorageNumber.svelte";
	import StorageSwitch from "@/entrypoints/options-v2/components/preferences/StorageSwitch.svelte";
	import { settingsStore } from "@/entrypoints/options-v2/stores/database-store.svelte";
	import { BACKGROUND_SERVICE } from "@/utils/services/proxy-services";
	import { updateNotification } from "./notification-storage";

	const soundOptions = [
		{ value: "default", label: "OS default" },
		{ value: "mute", label: "Mute" },
		{ value: "1", label: "Sound 1" },
		{ value: "2", label: "Sound 2" },
		{ value: "3", label: "Sound 3" },
		{ value: "4", label: "Sound 4" },
		{ value: "5", label: "Sound 5" },
		{ value: "custom", label: "Custom" },
	];

	let voices = $state([{ value: "default", label: "System Default" }]);

	const showPlayback = $derived(!["mute", "default"].includes($settingsStore.notifications.sound));

	function loadVoices() {
		voices = [
			{ value: "default", label: "System Default" },
			...window.speechSynthesis.getVoices().map((voice) => ({
				value: `${voice.name} (${voice.lang})`,
				label: `${voice.name} (${voice.lang})`,
			})),
		];
	}

	async function playNotificationSound() {
		await BACKGROUND_SERVICE.stopNotificationSound();
		await BACKGROUND_SERVICE.playNotificationSound(
			$settingsStore.notifications.sound,
			$settingsStore.notifications.volume,
			false,
		);
	}

	function updateVolume(value: number | number[]) {
		void updateNotification("volume", Array.isArray(value) ? value[0] : value);
	}

	function uploadCustomSound(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.addEventListener("load", (loadEvent) => {
			const result = loadEvent.target?.result;
			if (typeof result !== "string") return;

			if (result.length > 5_242_880) {
				toast.error("Maximum file size exceeded. (5MB)");
				return;
			}

			void updateNotification("soundCustom", result);
			toast.success("Custom notification sound uploaded.");
		});
		reader.readAsDataURL(file);
	}

	onMount(() => {
		const previousVoicesChanged = window.speechSynthesis.onvoiceschanged;
		window.speechSynthesis.onvoiceschanged = () => {
			loadVoices();
			previousVoicesChanged?.call(window.speechSynthesis, new Event("voiceschanged"));
		};
		loadVoices();

		return () => {
			window.speechSynthesis.onvoiceschanged = previousVoicesChanged;
		};
	});

	onDestroy(() => {
		void BACKGROUND_SERVICE.stopNotificationSound();
	});
</script>

<PreferenceSectionCard title="Sound">
	<div class="grid gap-1 grid-cols-2">
		<Field.Field orientation="responsive" class="rounded-md border border-border bg-background/60 p-2">
			<Field.Content>
				<Field.Label>Sound effect</Field.Label>
				<Field.Description class="text-xs">Mute and OS default might not work in all browsers.</Field.Description>
			</Field.Content>

			<ItemSelect
				items={soundOptions}
				placeholder="Select sound"
				value={$settingsStore.notifications.sound}
				onValueChange={(value) => void updateNotification("sound", value)}
			/>
		</Field.Field>

		{#if $settingsStore.notifications.sound === "custom"}
			<Field.Field orientation="responsive" class="rounded-md border border-border bg-background/60 p-2">
				<Field.Content>
					<Field.Label for="notification-custom-sound">Custom sound</Field.Label>
					{#if $settingsStore.notifications.soundCustom}
						<Field.Description class="text-xs">A custom sound is currently stored.</Field.Description>
					{/if}
				</Field.Content>

				<Input
					id="notification-custom-sound"
					type="file"
					accept=".mp3,.ogg,.wav"
					onchange={uploadCustomSound}
				/>
			</Field.Field>
		{/if}

		{#if showPlayback}
			<Field.Field orientation="responsive" class="rounded-md border border-border bg-background/60 p-2 col-span-2">
				<Field.Content>
					<Field.Label>Volume</Field.Label>
					<Field.Description class="text-xs">{$settingsStore.notifications.volume}%</Field.Description>
				</Field.Content>

				<div class="grid gap-2">
					<Slider
						type="single"
						value={$settingsStore.notifications.volume}
						min={1}
						max={100}
						step={1}
						onValueChange={updateVolume}
					/>
					<div class="flex gap-1.5 justify-end">
						<Button type="button" size="xs" variant="outline" onclick={() => void playNotificationSound()}>
							<PlayIcon />
							Play
						</Button>
						<Button type="button" size="xs" variant="outline" onclick={() => void BACKGROUND_SERVICE.stopNotificationSound()}>
							<StopIcon />
							Stop
						</Button>
					</div>
				</div>
			</Field.Field>
		{/if}

		<StorageSwitch path="settings.notifications.tts" label="Text-to-speech" class="col-span-2">
			<div class="grid grid-cols-2">
				<StorageNumber
					path="settings.notifications.ttsRate"
					label="Speech rate"
					min={0.1}
					max={10}
					step={0.1}
					disabled={$settingsStore.notifications.tts}
				/>
				<Field.Field orientation="responsive" class="rounded-md border border-border bg-background/60 p-2">
					<Field.Content>
						<Field.Label>TTS voice</Field.Label>
					</Field.Content>

					<ItemSelect
						items={voices}
						placeholder="Select voice"
						value={$settingsStore.notifications.ttsVoice}
						onValueChange={(value) => void updateNotification("ttsVoice", value)}
					/>
				</Field.Field>
			</div>
		</StorageSwitch>

	</div>
</PreferenceSectionCard>

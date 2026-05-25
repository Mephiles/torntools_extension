<script lang="ts">
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";
	import PreferenceSettingGroup from "../PreferenceSettingGroup.svelte";
	import StorageNumber from "../StorageNumber.svelte";
	import StorageSwitch from "../StorageSwitch.svelte";
	import ChatHighlights from "./ChatHighlights.svelte";
	import ColoredChats from "./ColoredChats.svelte";
</script>

<div class="space-y-2">
	<PreferenceSectionCard>
		<div class="grid gap-1">
			<PreferenceSettingGroup>
				<StorageNumber path="settings.pages.chat.fontSize" label="Font size" />
				<StorageSwitch path="settings.pages.chat.searchChat" label="Search chat" />
				<StorageSwitch path="settings.pages.chat.completeUsernames" label="Autocomplete usernames" />
				<StorageSwitch path="settings.pages.chat.tradeTimer" label="Trade chat timer till next post" />
				<StorageSwitch path="settings.pages.chat.hideChatButton" label="Button for hiding chat" />
				<StorageSwitch path="settings.pages.chat.resizable" label="Make chats resizable" />
			</PreferenceSettingGroup>
		</div>
	</PreferenceSectionCard>

	<ChatHighlights />

	<ColoredChats />
</div>

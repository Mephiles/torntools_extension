<script lang="ts">
	import { Badge } from "@svelte/components/ui/badge";
	import { Button } from "@svelte/components/ui/button";
	import * as Tooltip from "@svelte/components/ui/tooltip";
	import ChatHighlights from "@/entrypoints/options-v2/components/preferences/global/ChatHighlights.svelte";
	import ColoredChats from "@/entrypoints/options-v2/components/preferences/global/ColoredChats.svelte";
	import { settingsStore } from "@/entrypoints/options-v2/stores/database-store.svelte";
	import { ttStorage } from "@/utils/common/data/storage";
	import { ALL_ICONS, } from "@/utils/common/functions/torn";
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";
	import PreferenceSettingGroup from "../PreferenceSettingGroup.svelte";
	import StorageNumber from "../StorageNumber.svelte";
	import StorageSelect from "../StorageSelect.svelte";
	import StorageSwitch from "../StorageSwitch.svelte";
	import CustomLinks from "./CustomLinks.svelte";
	import OfficialIcon from "./OfficialIcon.svelte";
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

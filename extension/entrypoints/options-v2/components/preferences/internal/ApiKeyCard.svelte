<script lang="ts">
	import { Button } from "@svelte/components/ui/button";
	import * as Field from "@svelte/components/ui/field";
	import { Input } from "@svelte/components/ui/input";
	import { toast } from "svelte-sonner";
	import PreferenceSectionCard from "@/entrypoints/options-v2/components/preferences/PreferenceSectionCard.svelte";
	import { apiStore } from "@/entrypoints/options-v2/stores/database-store.svelte";
	import { changeAPIKey, checkAPIPermission } from "@/utils/common/functions/api";

	let apiKey = $state($apiStore.torn.key ?? "");
	let updating = $state(false);

	async function updateApiKey() {
		if (updating) return;

		updating = true;
		try {
			const { access } = await checkAPIPermission(apiKey);
			await changeAPIKey(apiKey);

			if (access) {
				toast.success("API key updated.");
			} else {
				toast.warning("Your API key is not the correct API level. This will affect a lot of features.");
			}
		} catch (error) {
			apiKey = $apiStore.torn.key ?? "";
			toast.error(typeof error === "string" ? error : "Couldn't update API key.");
		} finally {
			updating = false;
		}
	}
</script>

<PreferenceSectionCard>
	<Field.Field orientation="responsive" class="rounded-md border border-border bg-background/60 p-2">
		<Field.Content>
			<Field.Label for="api-key">API key</Field.Label>
			<Field.Description class="text-xs">
				TornTools uses a <span class="text-yellow-400">Limited Access</span> key.
			</Field.Description>
		</Field.Content>

		<div class="flex gap-1">
			<Input
				id="api-key"
				type="text"
				placeholder="API key"
				bind:value={apiKey}
				disabled={updating}
			/>
			<Button type="button" variant="outline" disabled={updating} onclick={() => void updateApiKey()}>
				Update
			</Button>
		</div>
	</Field.Field>
</PreferenceSectionCard>

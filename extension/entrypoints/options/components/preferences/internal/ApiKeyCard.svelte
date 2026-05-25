<script lang="ts">
	import { Button } from "@svelte/components/ui/button";
	import * as Field from "@svelte/components/ui/field";
	import { Input } from "@svelte/components/ui/input";
	import { toast } from "svelte-sonner";
	import { changeAPIKey, checkAPIPermission } from "@/utils/common/functions/api";
	import { apiStore } from "../../../stores/database-store.svelte";
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";

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

	<div class="mt-1 rounded-md border border-border bg-background/60 p-2 text-sm">
		<h3 class="font-bold">Disclaimer</h3>
		<div class="mt-1 space-y-1 text-muted-foreground">
			<p>The user is allowed to make 100 requests to Torn's API in a minute.</p>
			<p>The creators of this extension are not responsible if the user:</p>
			<ul class="list-disc pl-5">
				<li>spams requests too much</li>
				<li>tries to use the wrong API key too many times</li>
			</ul>
			<p>
				If for some reason you do get your IP blocked because the extension had a bug or glitched or anything, our apologies. Please let us know of such incidents so we can avoid them in the future.
			</p>
		</div>
	</div>
</PreferenceSectionCard>

<script lang="ts">
	import { ENABLE_PLAYGROUND_TORNTOOLS } from "@common/utils/feature-toggles";
	import PreferenceSectionCard from "../PreferenceSectionCard.svelte";
	import StorageSwitch from "../StorageSwitch.svelte";
	import ExternalServiceCard from "./ExternalServiceCard.svelte";
</script>

<div class="space-y-2">
	<PreferenceSectionCard>By enabling these services, you agree to the usage of these services as they are provided.</PreferenceSectionCard>

	<ExternalServiceCard
		title="TornStats"
		description="Your API key is used to authenticate."
		path="settings.external.tornstats"
		enableLabel="Enable TornStats"
		origin={"tornstats"}
		links={[
			{ label: "Website", href: "https://tornstats.com/" },
			{ label: "Terms of Service", href: "https://tornstats.com/tos" },
		]}
		keyPath="api.tornstats.key"
		keyDescription="Only required if you use a different key for TornStats. Will use known key otherwise."
	/>

	<ExternalServiceCard
		title="YATA"
		description="Your API key is used to authenticate."
		path="settings.external.yata"
		enableLabel="Enable YATA"
		origin={"yata"}
		links={[
			{ label: "Website", href: "https://yata.yt/" },
			{ label: "Terms of Service", href: "https://yata.yt/tos" },
		]}
		keyPath="api.yata.key"
		keyDescription="Only required if you use a different key for YATA. Will use known key otherwise."
	/>

	<ExternalServiceCard
		title="Prometheus"
		description="Your API key is not shared with this service."
		path="settings.external.prometheus"
		enableLabel="Enable Prometheus"
		origin={"prometheus"}
	/>

	<ExternalServiceCard
		title="LZPT"
		description="Your API key is not shared with this service."
		path="settings.external.lzpt"
		enableLabel="Enable LZPT"
		origin={"lzpt"}
	/>

	<ExternalServiceCard
		title="TornW3B"
		description="Your API key is not used to authenticate at this time, but it will be in the future as additional functionality is added."
		path="settings.external.tornw3b"
		enableLabel="Enable TornW3B"
		origin={"tornw3b"}
		links={[
			{ label: "Website", href: "https://weav3r.dev" },
			{ label: "Terms of Service", href: "https://weav3r.dev/terms-of-service" },
		]}
	/>

	<ExternalServiceCard
		title="FFScouter"
		description="Your API key is used to authenticate."
		path="settings.external.ffScouter"
		enableLabel="Enable FFScouter"
		origin={"ffscouter"}
		links={[
			{ label: "Website", href: "https://ffscouter.com" },
			{ label: "Terms of Service", href: "https://ffscouter.com" },
		]}
		keyPath="api.ffScouter.key"
		keyDescription="Only required if you use a different key for FFScouter. Will use known key otherwise."
	/>

	<ExternalServiceCard
		title="Torn Intel"
		description="Your API key is not shared with this service."
		path="settings.external.tornintel"
		enableLabel="Enable Torn Intel"
		origin={"tornintel"}
		links={[
			{ label: "Website", href: "https://torn-intel.com" },
			{ label: "Terms of Service", href: "https://torn-intel.com/terms" },
		]}
	/>

	<ExternalServiceCard
		title="Torn Probability"
		description="Your API key is not shared with this service."
		path="settings.external.tornprobability"
		enableLabel="Enable Torn Probability"
		origin={"tornprobability"}
		links={[{ label: "Forum Thread", href: "https://www.torn.com/forums.php#p=threads&f=67&t=16449041" }]}
		popupDescription="Torn Probability works best with scenario submission enabled. You can change this any time."
	>
		{#snippet popupContent()}
			<StorageSwitch
				path="settings.pages.faction.submitScenarios"
				label="Anonymously submit OC2 scenario data"
				description="Shares your organized crime scenario outcomes to improve recommendations."
			/>
		{/snippet}
	</ExternalServiceCard>

	{#if ENABLE_PLAYGROUND_TORNTOOLS}
		<ExternalServiceCard
			title="Playground TornTools"
			description="Semi-official service for TornTools."
			path="settings.external.playgroundTorntools"
			enableLabel="Enable Playground TornTools"
			origin={"playground_torntools"}
			links={[
				{ label: "Website", href: "https://torntools.tornplayground.eu" },
				{ label: "Terms of Service", href: "https://torntools.tornplayground.eu/tos" },
			]}
		/>
	{/if}
</div>

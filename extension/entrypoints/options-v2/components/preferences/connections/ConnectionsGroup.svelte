<script lang="ts">
	import ExternalServiceCard from "@/entrypoints/options-v2/components/preferences/connections/ExternalServiceCard.svelte";
	import PreferenceSectionCard from "@/entrypoints/options-v2/components/preferences/PreferenceSectionCard.svelte";
</script>

<div class="space-y-2">
	<PreferenceSectionCard>
		By enabling these services, you agree to the usage of these services as they are provided.
	</PreferenceSectionCard>

	<ExternalServiceCard
		title="TornStats"
		description="Your API key is used to authenticate."
		path="settings.external.tornstats"
		enableLabel="Enable TornStats"
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
	/>

	<ExternalServiceCard
		title="LZPT"
		description="Your API key is not shared with this service."
		path="settings.external.lzpt"
		enableLabel="Enable LZPT"
	/>

	<ExternalServiceCard
		title="TornW3B"
		description="Your API key is not used to authenticate at this time, but it will be in the future as additional functionality is added."
		path="settings.external.tornw3b"
		enableLabel="Enable TornW3B"
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
		links={[
			{ label: "Website", href: "https://torn-intel.com" },
			{ label: "Terms of Service", href: "https://torn-intel.com/terms" },
		]}
	/>
</div>
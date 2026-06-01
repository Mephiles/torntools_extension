<script lang="ts">
	import SectionNotFound from "../SectionNotFound.svelte";
	import CombatSection from "./CombatSection.svelte";
	import CompaniesSection from "./CompaniesSection.svelte";
	import FactionSection from "./FactionSection.svelte";
	import GymSection from "./GymSection.svelte";
	import InformationSection from "./InformationSection.svelte";
	import ProfileSection from "./ProfileSection.svelte";
	import SpeedSection from "./SpeedSection.svelte";
	import TravelSection from "./TravelSection.svelte";

	interface QolGroupProps {
		sectionId?: string;
	}

	let { sectionId }: QolGroupProps = $props();
</script>

{#if sectionId === "information"}
	<InformationSection />
{:else if sectionId === "combat"}
	<CombatSection />
{:else if sectionId === "travel"}
	<TravelSection />
{:else if sectionId === "faction"}
	<FactionSection />
{:else if sectionId === "profile"}
	<ProfileSection />
{:else if sectionId === "companies"}
	<CompaniesSection />
{:else if sectionId === "gym"}
	<GymSection />
{:else if sectionId === "speed"}
	<SpeedSection />
{:else}
	<SectionNotFound />
{/if}

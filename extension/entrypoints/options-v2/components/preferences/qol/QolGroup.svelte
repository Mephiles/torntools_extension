<script lang="ts">
	import CombatSection from "@/entrypoints/options-v2/components/preferences/qol/CombatSection.svelte";
	import CompaniesSection from "@/entrypoints/options-v2/components/preferences/qol/CompaniesSection.svelte";
	import FactionSection from "@/entrypoints/options-v2/components/preferences/qol/FactionSection.svelte";
	import GymSection from "@/entrypoints/options-v2/components/preferences/qol/GymSection.svelte";
	import ProfileSection from "@/entrypoints/options-v2/components/preferences/qol/ProfileSection.svelte";
	import SpeedSection from "@/entrypoints/options-v2/components/preferences/qol/SpeedSection.svelte";
	import TravelSection from "@/entrypoints/options-v2/components/preferences/qol/TravelSection.svelte";
	import SectionNotFound from "@/entrypoints/options-v2/components/preferences/SectionNotFound.svelte";
	import InformationSection from "./InformationSection.svelte";

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

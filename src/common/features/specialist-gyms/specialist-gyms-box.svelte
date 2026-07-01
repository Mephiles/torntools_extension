<script lang="ts">
  import Container from "@common/utils/components/container/container.svelte";
  import { ttStorage } from "@common/utils/context";
  import { formatNumber } from "@common/utils/functions/formatting";
  import BattleStatInfo from "./battle-stat-info.svelte";
  import { type BattleStat, battleStats } from "./models/battle-stat";
  import {
    type SpecialGym,
    specialGymDescMap,
    specialGyms,
  } from "./models/special-gym";
  import type { SpecialGymsCalcResult } from "./stats-calculations";

  interface SpecialistGymsBoxProps {
    stats: Record<BattleStat, number>;
    selectedSpecialGym1: SpecialGym | "none";
    selectedSpecialGym2: SpecialGym | "none";
    gymsData: SpecialGymsCalcResult;
  }

  let {
    stats,
    selectedSpecialGym1 = $bindable(),
    selectedSpecialGym2 = $bindable(),
    gymsData,
  }: SpecialistGymsBoxProps = $props();

  interface SpecialGymOption {
    value: "none" | SpecialGym;
    description: string;
  }

  const specialGymOptions: SpecialGymOption[] = [
    {
      value: "none",
      description: "none",
    },
    ...specialGyms.map(
      (specialGym): SpecialGymOption => ({
        value: specialGym,
        description: specialGymDescMap[specialGym],
      }),
    ),
  ];

  async function specialGymSelected1(specialGym: SpecialGym | "none") {
    selectedSpecialGym1 = specialGym;
    await ttStorage.change({ filters: { gym: { specialist1: specialGym } } });
  }

  async function specialGymSelected2(specialGym: SpecialGym | "none") {
    selectedSpecialGym2 = specialGym;
    await ttStorage.change({ filters: { gym: { specialist2: specialGym } } });
  }
</script>

<div class="specialist-gym-box">
  <Container title="Specialist Gyms" compact={true}>
    <div class="content">
      <div class="selects">
        <select bind:value={() => selectedSpecialGym1, specialGymSelected1}>
          {#each specialGymOptions as specialGymOption}
            <option value={specialGymOption.value}
              >{specialGymOption.description}</option
            >
          {/each}
        </select>
        <select bind:value={() => selectedSpecialGym2, specialGymSelected2}>
          {#each specialGymOptions as specialGymOption}
            <option value={specialGymOption.value}
              >{specialGymOption.description}</option
            >
          {/each}
        </select>
      </div>
      <div class="info">
        {#if gymsData.type === "none"}
          <div class="gyms-message">No special gyms were selected.</div>
        {:else if gymsData.type === "impossible"}
          <div class="gyms-message">
            This combination of specialist gyms is impossible.
          </div>
        {:else}
          <div class="stats-info">
            {#each battleStats as battleStat}
              {@const statValue =
                stats[battleStat] + gymsData.missing[battleStat]}
              <div class="stat-info">
                <div class="stat-header">{battleStat}</div>
                <div class="stat-value">{formatNumber(statValue)}</div>
                <BattleStatInfo type="required" {battleStat} {gymsData} />
                <BattleStatInfo type="allowed" {battleStat} {gymsData} />
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </Container>
</div>

<style>
  .specialist-gym-box {
    margin-top: 10px;
  }

  .content {
    display: flex;
    flex-direction: column;
    padding: 5px;
  }

  .selects {
    display: flex;
    justify-content: space-evenly;
    flex-wrap: wrap;
    row-gap: 5px;
  }

  .info {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 1.2em;
    padding: 5px 0 0 0;
  }

  .gyms-message {
    font-weight: bold;
  }

  .stats-info {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    width: 100%;
  }

  .stat-info {
    flex: 1;
    min-width: fit-content;
    display: flex;
    flex-direction: column;
    gap: 2px;
    border-radius: 5px;
    padding: 5px;
  }

  :global(body:not(.dark-mode)) .stat-info {
    border: 1px solid lightgray;
    background-color: white;
  }

  :global(body.dark-mode) .stat-info {
    border: 1px solid #444;
    background-color: #333;
  }

  .stat-header {
    align-self: center;
    font-weight: bold;
    text-decoration: underline;
  }

  .stat-value {
    font-size: 0.9em;
    align-self: center;
  }
</style>

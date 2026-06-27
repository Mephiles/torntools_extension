<script lang="ts">
  import { formatNumber } from "@common/utils/functions/formatting";
  import type { BattleStat } from "./models/battle-stat";
  import type { SpecialGymsCalcResult } from "./stats-calculations";

  interface BattleStatInfoProps {
    gymsData: SpecialGymsCalcResult;
    battleStat: BattleStat;
    marginTopPx?: number;
    type?: "required" | "allowed";
  }

  let {
    gymsData,
    battleStat,
    marginTopPx,
    type: propType,
  }: BattleStatInfoProps = $props();
</script>

{#if gymsData.type === "success"}
  {@const type =
    propType ?? (gymsData.missing[battleStat] ? "required" : "allowed")}
  {@const value =
    type === "required"
      ? gymsData.missing[battleStat]
      : gymsData.missing[battleStat] + gymsData.available[battleStat]}
  <div class="stat {type}" style:margin-top="{marginTopPx}px">
    <span>{type === "required" ? "Required" : "Allowed"}: </span>
    <span>{formatNumber(value)}</span>
  </div>
{/if}

<style>
  .stat {
    font-size: 0.9em;
  }

  .required {
    color: var(--tt-color-red);
  }

  .allowed {
    color: var(--tt-color-green);
  }
</style>

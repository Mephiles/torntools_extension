<script lang="ts">
  import { ttStorage } from "@common/utils/context";
  import { filters } from "@common/utils/data/database";
  import { camelCase } from "@common/utils/functions/formatting";
  import { PHFillCaretDown } from "@common/utils/icons/phosphor-icons";
  import type { Snippet } from "svelte";

  interface ContainerProps {
    children: Snippet;
    title: string;
    compact?: boolean;
    showHeader?: boolean;
    collapsible?: boolean;
    applyRounding?: boolean;
    onlyHeader?: boolean;
    contentBackground?: boolean;
  }

  let {
    children,
    title,
    compact = false,
    showHeader = true,
    collapsible = true,
    applyRounding = true,
    onlyHeader = false,
    contentBackground = true,
  }: ContainerProps = $props();
  let id = $derived(camelCase(title));
  let collapsed = $derived.by(
    () => onlyHeader || (collapsible && (filters.containers[id] ?? false)),
  );

  function headerClicked() {
    collapsed = !collapsed;
    ttStorage.change({ filters: { containers: { [id]: collapsed } } });
  }
</script>

<div class:compact class:collapsible class:rounding={applyRounding}>
  {#if showHeader}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="title" class:collapsed onclick={headerClicked}>
      <div class="text">{title}</div>
      {#if collapsible}
        {@html PHFillCaretDown({ class: "icon" }).outerHTML}
      {/if}
    </div>
  {/if}
  {#if !collapsed}
    <main class:background={contentBackground}>
      {@render children()}
    </main>
  {/if}
</div>

<style>
  .title {
    padding-left: 10px;
    height: 30px;
    font-size: 13px;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.65);
    letter-spacing: 1px;
    display: flex;
    white-space: nowrap;
    margin: initial;
    align-items: center;
    color: var(--tt-theme-color);
    background: var(--tt-theme-background);
  }

  .collapsible > .title {
    cursor: pointer;
  }

  .rounding > .title.collapsed {
    border-radius: 5px;
  }

  .rounding > .title:not(.collapsed) {
    border-radius: 5px 5px 0px 0px;
  }

  .text {
    width: -webkit-fill-available;
    width: -moz-available;
  }

  .title > :global(.icon) {
    min-width: 30px;
    font-size: 16px;
    text-align: center;
    position: static !important;
    margin: auto;
  }

  .title.collapsed > :global(.icon) {
    transform: rotate(-90deg);
  }

  main.background {
    background-color: var(--default-bg-panel-color);
  }

  .rounding > main {
    border-radius: 0px 0px 5px 5px;
  }
</style>

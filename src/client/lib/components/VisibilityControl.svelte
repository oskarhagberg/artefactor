<script lang="ts">
  import { VIS, VIS_ORDER, type Visibility } from "../format";
  import { overlay } from "../ui.svelte";
  import Icon from "./Icon.svelte";

  interface Props {
    id: string;
    visibility: Visibility;
    variant?: "block" | "pill";
    onChoose: (v: Visibility) => void;
  }
  let { id, visibility, variant = "block", onChoose }: Props = $props();

  const key = $derived(`vis:${id}`);
  const open = $derived(overlay.isOpen(key));
  const meta = $derived(VIS[visibility]);

  const btnStyle = $derived(
    variant === "block"
      ? "width:100%;display:flex;align-items:center;gap:7px;height:30px;padding:0 9px;border:1px solid var(--border);background:var(--subtle);color:var(--fg);border-radius:8px;font-size:12px;cursor:pointer;font-family:inherit;"
      : "display:flex;align-items:center;gap:6px;height:32px;padding:0 11px;border:1px solid var(--border);background:var(--subtle);color:var(--fg);border-radius:8px;font-size:12px;cursor:pointer;font-family:inherit;white-space:nowrap;",
  );
  const menuStyle = $derived(
    variant === "block"
      ? "position:absolute;left:0;right:0;top:36px;z-index:36;background:var(--card);border:1px solid var(--border);border-radius:11px;box-shadow:var(--shadow-md);padding:5px;animation:af-menu .12s ease;"
      : "position:absolute;right:0;top:38px;z-index:36;min-width:236px;background:var(--card);border:1px solid var(--border);border-radius:11px;box-shadow:var(--shadow-md);padding:5px;animation:af-menu .12s ease;",
  );

  function choose(v: Visibility) {
    overlay.close();
    if (v !== visibility) onChoose(v);
  }
</script>

<div style="position:relative;{variant === 'block' ? '' : 'flex-shrink:0;'}">
  <button onclick={() => overlay.toggle(key)} style={btnStyle}>
    <Icon paths={meta.icon} size={13} />
    <span style="font-weight:500;">{meta.label}</span>
    <Icon
      paths={["M6 9l6 6 6-6"]}
      size={12}
      style="color:var(--muted-fg);{variant === 'block' ? 'margin-left:auto;' : ''}"
    />
  </button>
  {#if open}
    <div style={menuStyle}>
      {#each VIS_ORDER as v (v)}
        {@const vm = VIS[v]}
        {@const active = visibility === v}
        <button
          onclick={() => choose(v)}
          style="width:100%;display:flex;align-items:flex-start;gap:9px;padding:8px 9px;border:none;background:{active
            ? 'var(--accent-soft)'
            : 'none'};color:var(--fg);border-radius:8px;cursor:pointer;text-align:left;font-family:inherit;"
        >
          <Icon paths={vm.icon} size={15} style="margin-top:1px;flex-shrink:0;" />
          <span style="flex:1;min-width:0;">
            <span style="display:block;font-size:12.5px;font-weight:500;">{vm.label}</span>
            <span style="display:block;font-size:11px;color:var(--muted-fg);">{vm.desc}</span>
          </span>
          {#if active}
            <Icon
              paths={["M20 6L9 17l-5-5"]}
              size={14}
              width={2.4}
              color="var(--primary)"
              style="flex-shrink:0;margin-top:2px;"
            />
          {/if}
        </button>
      {/each}
    </div>
  {/if}
</div>

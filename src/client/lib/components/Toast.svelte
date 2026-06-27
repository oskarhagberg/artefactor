<script lang="ts">
  import { toast } from "../toast.svelte";
  import Icon from "./Icon.svelte";

  const t = $derived(toast.current);
</script>

{#if t}
  <div
    style="position:fixed;bottom:26px;left:50%;transform:translateX(-50%);z-index:80;display:flex;align-items:center;gap:11px;padding:11px 14px 11px 15px;background:var(--fg);color:var(--bg);border-radius:11px;box-shadow:var(--shadow-lg);font-size:13px;animation:af-toast .2s ease;max-width:420px;"
  >
    <Icon paths={t.icon} size={16} width={2.2} style="flex-shrink:0;opacity:.9;" />
    <span style="font-weight:450;">{t.msg}</span>
    {#if t.action}
      <button
        onclick={t.action}
        style="margin-left:6px;background:none;border:none;color:var(--bg);font-weight:600;font-size:13px;cursor:pointer;font-family:inherit;text-decoration:underline;text-underline-offset:2px;opacity:.85;"
      >
        {t.actionLabel}
      </button>
    {/if}
  </div>
{/if}

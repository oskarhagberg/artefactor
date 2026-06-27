<script lang="ts">
  import { signIn, signUp } from "../auth";
  import Icon from "./Icon.svelte";

  let mode = $state<"sign-in" | "sign-up">("sign-in");
  let name = $state("");
  let email = $state("");
  let password = $state("");
  let error = $state<string | null>(null);
  let busy = $state(false);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    error = null;
    busy = true;
    const res =
      mode === "sign-up"
        ? await signUp.email({ name, email, password })
        : await signIn.email({ email, password });
    busy = false;
    if (res.error) error = res.error.message ?? "Authentication failed";
    else password = "";
  }

  const tab = (active: boolean) =>
    `height:30px;padding:0 14px;border:none;border-radius:7px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;${
      active
        ? "background:var(--card);color:var(--fg);box-shadow:var(--shadow);"
        : "background:none;color:var(--muted-fg);"
    }`;
  const inputStyle =
    "width:100%;height:40px;padding:0 12px;border:1px solid var(--border);background:var(--card);color:var(--fg);border-radius:9px;font-size:13.5px;font-family:inherit;outline:none;";
</script>

<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);padding:24px;">
  <div style="width:100%;max-width:380px;">
    <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:22px;">
      <div style="width:32px;height:32px;border-radius:8px;background:var(--primary);display:flex;align-items:center;justify-content:center;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="3" width="12" height="15" rx="2.5" fill="var(--primary-fg)" opacity="0.5" />
          <rect x="8" y="6" width="12" height="15" rx="2.5" fill="var(--primary-fg)" />
        </svg>
      </div>
      <span style="font-size:18px;font-weight:600;letter-spacing:-0.02em;">Artefactor</span>
    </div>

    <div style="background:var(--card);border:1px solid var(--border);border-radius:16px;box-shadow:var(--shadow-md);padding:22px;">
      <div style="display:flex;align-items:center;gap:2px;background:var(--muted);padding:3px;border-radius:9px;margin-bottom:18px;">
        <button onclick={() => (mode = "sign-in")} style="flex:1;{tab(mode === 'sign-in')}">Sign in</button>
        <button onclick={() => (mode = "sign-up")} style="flex:1;{tab(mode === 'sign-up')}">Create account</button>
      </div>

      <form onsubmit={submit} style="display:flex;flex-direction:column;gap:12px;">
        {#if mode === "sign-up"}
          <input bind:value={name} placeholder="Name" required style={inputStyle} />
        {/if}
        <input bind:value={email} type="email" placeholder="Email" required style={inputStyle} />
        <input bind:value={password} type="password" placeholder="Password" required style={inputStyle} />

        {#if error}
          <div style="display:flex;align-items:center;gap:5px;font-size:12px;color:var(--destructive);">
            <Icon paths={["M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20", "M12 8v4", "M12 16h.01"]} size={13} />{error}
          </div>
        {/if}

        <button
          type="submit"
          disabled={busy}
          style="height:40px;border:none;background:var(--primary);color:var(--primary-fg);border-radius:9px;font-size:13.5px;font-weight:600;cursor:{busy
            ? 'default'
            : 'pointer'};font-family:inherit;opacity:{busy ? 0.7 : 1};margin-top:2px;"
        >
          {mode === "sign-up" ? "Create account" : "Sign in"}
        </button>
      </form>
    </div>
  </div>
</div>

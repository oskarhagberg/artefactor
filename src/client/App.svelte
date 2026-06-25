<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { signIn, signUp, signOut, useSession } from "$lib/auth";
  import type { MeResponse } from "../shared/contracts";

  const session = useSession();

  // Auth form state.
  let mode = $state<"sign-in" | "sign-up">("sign-in");
  let name = $state("");
  let email = $state("");
  let password = $state("");
  let error = $state<string | null>(null);
  let busy = $state(false);

  // Result of calling the protected BFF endpoint, to prove the session reaches
  // the API as a stable ownerId.
  let me = $state<MeResponse | null>(null);
  let meError = $state<string | null>(null);

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    error = null;
    busy = true;
    const res =
      mode === "sign-up"
        ? await signUp.email({ name, email, password })
        : await signIn.email({ email, password });
    busy = false;
    if (res.error) {
      error = res.error.message ?? "Authentication failed";
    } else {
      password = "";
    }
  }

  async function callMe() {
    meError = null;
    me = null;
    const res = await fetch("/api/me");
    if (res.ok) {
      me = await res.json();
    } else {
      meError = `${res.status} ${res.statusText}`;
    }
  }
</script>

<main class="mx-auto max-w-md space-y-6 p-8">
  <h1 class="text-2xl font-semibold">Artefactor</h1>

  {#if $session.isPending}
    <p class="text-sm">Loading session…</p>
  {:else if $session.data}
    <section class="space-y-3">
      <p class="text-sm">
        Signed in as <strong>{$session.data.user.email}</strong>
      </p>
      <div class="flex gap-2">
        <Button onclick={callMe}>Call protected /api/me</Button>
        <Button onclick={() => signOut()}>Sign out</Button>
      </div>
      {#if me}
        <pre class="rounded bg-zinc-100 p-3 text-xs">{JSON.stringify(
            me,
            null,
            2,
          )}</pre>
      {:else if meError}
        <p class="text-sm text-red-600">/api/me failed: {meError}</p>
      {/if}
    </section>
  {:else}
    <form class="space-y-3" onsubmit={submit}>
      <div class="flex gap-2 text-sm">
        <button
          type="button"
          class="underline-offset-2 {mode === 'sign-in' ? 'font-semibold underline' : ''}"
          onclick={() => (mode = "sign-in")}>Sign in</button
        >
        <button
          type="button"
          class="underline-offset-2 {mode === 'sign-up' ? 'font-semibold underline' : ''}"
          onclick={() => (mode = "sign-up")}>Create account</button
        >
      </div>

      {#if mode === "sign-up"}
        <input
          class="w-full rounded border px-3 py-2 text-sm"
          placeholder="Name"
          bind:value={name}
          required
        />
      {/if}
      <input
        class="w-full rounded border px-3 py-2 text-sm"
        type="email"
        placeholder="Email"
        bind:value={email}
        required
      />
      <input
        class="w-full rounded border px-3 py-2 text-sm"
        type="password"
        placeholder="Password"
        bind:value={password}
        required
      />

      {#if error}
        <p class="text-sm text-red-600">{error}</p>
      {/if}

      <Button type="submit" disabled={busy}>
        {mode === "sign-up" ? "Create account" : "Sign in"}
      </Button>
    </form>
  {/if}
</main>

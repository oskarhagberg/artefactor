<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import type { HealthResponse } from "../shared/contracts";

  let health = $state<string>("checking…");

  async function checkHealth() {
    health = "checking…";
    try {
      const res = await fetch("/health");
      const body: HealthResponse = await res.json();
      health = body.status;
    } catch {
      health = "unreachable";
    }
  }

  checkHealth();
</script>

<main class="mx-auto max-w-xl space-y-4 p-8">
  <h1 class="text-2xl font-semibold">Artefactor</h1>
  <p class="text-sm">
    Scaffold is alive. Backend health: <strong>{health}</strong>
  </p>
  <Button onclick={checkHealth}>Re-check health</Button>
</main>

<script lang="ts">
  /** Renders a Lucide-style stroke icon from an array of `<path d="">` strings.
   *  All icons in the design share the same 24×24 box and round caps/joins. */
  interface Props {
    paths: readonly string[];
    size?: number;
    width?: number;
    color?: string;
    style?: string;
  }
  let {
    paths,
    size = 16,
    width = 2,
    color = "currentColor",
    style = "",
  }: Props = $props();
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke={color}
  stroke-width={width}
  stroke-linecap="round"
  stroke-linejoin="round"
  {style}
>
  {#each paths as d (d)}
    <path {d} />
  {/each}
</svg>

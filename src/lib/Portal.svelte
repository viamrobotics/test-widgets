<script lang="ts">
	import { portalStore } from './portal'

	let { name } = $props<{
		name: string
	}>()

	const store = portalStore(name)
</script>

{#each $store as entry (entry.id)}
	{@render entry.snippet()}
{/each}

<script lang="ts">
	import type { Snippet } from 'svelte'

	import { onMount } from 'svelte'

	import { registerPortal } from '$lib/portal'

	let {
		name,
		children,
	}: {
		name: string
		children: Snippet
	} = $props()

	let unregister: (() => void) | undefined

	onMount(() => {
		unregister = registerPortal(name, children)

		return () => {
			unregister?.()
		}
	})
</script>

<script lang="ts">
	import type { Snippet } from 'svelte'

	import { provideWidgetState } from './resource-widget-state.ts'

	interface Props {
		children: Snippet
	}

	const { children }: Props = $props()

	provideWidgetState()
</script>

{@render children()}

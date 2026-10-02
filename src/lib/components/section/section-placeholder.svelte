<script lang="ts">
	import type { ClassValue } from 'svelte/elements'

	import { useSectionLoading } from './section-loading'

	interface Props {
		class?: ClassValue
	}

	const { class: className = 'w-12' }: Props = $props()

	const loading = useSectionLoading()
</script>

{#if loading.isLoading}
	<span
		aria-hidden="true"
		data-testid="section-placeholder-loading"
		class={[
			'bg-gray-2 inline-block h-2.5 animate-pulse align-middle motion-reduce:animate-none',
			className,
		]}
	></span>
{:else}
	<span class="text-subtle-2">
		<span aria-hidden="true">—</span>
		<span class="sr-only">No data</span>
	</span>
{/if}

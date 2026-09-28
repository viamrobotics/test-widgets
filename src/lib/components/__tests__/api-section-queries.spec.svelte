<script lang="ts">
	import type { SectionQuery } from '../use-query-errors.svelte'

	import ApiSection from '../api-section.svelte'

	interface Props {
		queries: SectionQuery[]
		lastError?: Error | null
	}

	const { queries, lastError = null }: Props = $props()
</script>

<ApiSection
	class="flex-col gap-4"
	{queries}
	{lastError}
>
	{#snippet heading()}Polled{/snippet}
	<p>content</p>
</ApiSection>

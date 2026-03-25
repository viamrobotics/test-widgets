<script lang="ts">
	import type { QueryObserverResult } from '@tanstack/svelte-query'
	import type { Snippet } from 'svelte'

	import Queries from './queries.svelte'

	interface Props {
		query: QueryObserverResult
		contentCx?: string
		children?: Snippet
	}

	const { query, contentCx = '', children }: Props = $props()
</script>

<Queries
	queries={[query]}
	{contentCx}
>
	{@render children?.()}
</Queries>

<script lang="ts">
	import type { QueryObserverResult } from '@tanstack/svelte-query'
	import type { Snippet } from 'svelte'
	import type { ClassValue } from 'svelte/elements'

	import Queries from './queries.svelte'

	interface Props {
		query: QueryObserverResult
		class?: ClassValue
		children?: Snippet
	}

	const { query, class: classNames = '', children }: Props = $props()
</script>

<Queries
	queries={[query]}
	class={classNames}
>
	{@render children?.()}
</Queries>

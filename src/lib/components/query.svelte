<!--
  @component

  @deprecated A section owns its async state now. Pass the query to `ApiSection` as `queries`, or to a
  `Section` control's `useSectionErrors` call, and guard `query.data` in the children. Kept for the sectionless files until their resource PRs.
-->

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

	const { query, class: classNames, children }: Props = $props()
</script>

<Queries
	queries={[query]}
	class={classNames}
>
	{@render children?.()}
</Queries>

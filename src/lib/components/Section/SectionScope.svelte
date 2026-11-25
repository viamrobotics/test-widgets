<script lang="ts">
	import type { Snippet } from 'svelte'

	import {
		createSectionScope,
		provideSectionHostScope,
		type SectionScopeSources,
	} from './section-scope-context.svelte'

	interface Props extends SectionScopeSources {
		children: Snippet
	}

	const { children, ...sources }: Props = $props()

	provideSectionHostScope(createSectionScope(() => sources))
</script>

<!--
	Renders nothing of its own. The parts below read the method, docs, errors, and first load from
	it, and an `ApiSection` below registers its method, queries, and mutations into it.
-->
{@render children()}

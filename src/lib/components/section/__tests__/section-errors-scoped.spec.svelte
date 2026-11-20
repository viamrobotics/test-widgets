<script lang="ts">
	import SectionErrors from '../section-errors.svelte'
	import { createSectionScope, provideSectionScope } from '../section-scope-context.svelte'

	interface Props {
		method?: string
	}

	const { method }: Props = $props()

	provideSectionScope(createSectionScope(() => ({ method })))
</script>

<SectionErrors />

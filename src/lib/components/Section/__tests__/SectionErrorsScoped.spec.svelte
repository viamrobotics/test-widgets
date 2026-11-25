<script lang="ts">
	import { createSectionScope, provideSectionScope } from '../section-scope-context.svelte'
	import SectionErrors from '../SectionErrors.svelte'

	interface Props {
		method?: string
	}

	const { method }: Props = $props()

	provideSectionScope(createSectionScope(() => ({ method })))
</script>

<SectionErrors />

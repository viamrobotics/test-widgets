<script lang="ts">
	import { Progress } from '@viamrobotics/prime-ui'

	import { useSectionScope } from './section-scope-context.svelte'

	const scope = useSectionScope()
</script>

<!-- An indeterminate bar on the enclosing scope's first load only. Nothing outside a scope. -->
{#if scope?.isLoading}
	<Progress label="Loading" />
{/if}

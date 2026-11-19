<script lang="ts">
	import { mdiBookOpen } from '@mdi/js'
	import { Icon, Tooltip } from '@viamrobotics/prime-ui'

	import { useSectionScope } from './section-scope-context.svelte'

	const scope = useSectionScope()

	const href = $derived(scope?.docsHref)
	const label = $derived(scope?.method ? `${scope.method} docs` : 'Docs')
	const description = $derived(scope?.description)
</script>

{#snippet link(docsHref: string)}
	<a
		class="icon-button size-6"
		href={docsHref}
		target="_blank"
		rel="noopener noreferrer external"
		aria-label={label}
	>
		<Icon
			icon={mdiBookOpen}
			size="sm"
		/>
	</a>
{/snippet}

<!-- The scope's docs link. Its description, when the method has one, is the link's tooltip. -->
{#if href}
	{#if description}
		<Tooltip>
			<Tooltip.Trigger>
				{@render link(href)}
			</Tooltip.Trigger>
			<Tooltip.Content class="max-w-72 text-xs whitespace-pre-line">
				{#if typeof description === 'string'}
					{description}
				{:else}
					{@render description()}
				{/if}
			</Tooltip.Content>
		</Tooltip>
	{:else}
		{@render link(href)}
	{/if}
{/if}

<script lang="ts">
	import { ResourceName } from '@viamrobotics/sdk'

	import { apiDocsHref } from '$lib/api-docs-href'
	import SectionTitle from '$lib/components/section-title.svelte'

	import DoCommand from '../do-command/do-command.svelte'

	interface Props {
		partID: string
		resourceName: string
		isComponent: boolean
	}

	const { partID, resourceName, isComponent }: Props = $props()

	const api = $derived(`rdk:${isComponent ? 'component' : 'service'}:generic`)

	const genericResourceName = $derived<ResourceName>({
		namespace: 'rdk',
		type: isComponent ? 'component' : 'service',
		subtype: 'generic',
		name: resourceName,
	})
</script>

<div class="flex flex-col py-2 pl-4">
	<SectionTitle
		title="DoCommand"
		method="doCommand"
		href={apiDocsHref(api, 'doCommand')}
	/>
</div>

{#key genericResourceName}
	<DoCommand
		{partID}
		resource={genericResourceName}
	/>
{/key}

<script lang="ts">
	import { ResourceName } from '@viamrobotics/sdk'

	import SectionHeading from '$lib/components/section-heading.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import DoCommand from '../do-command/do-command.svelte'

	interface Props {
		partID: string
		resourceName: string
		isComponent: boolean
	}

	const { partID, resourceName, isComponent }: Props = $props()

	const api = $derived(
		isComponent ? ResourceTriplets.GenericComponent : ResourceTriplets.GenericService
	)

	const genericResourceName = $derived<ResourceName>({
		namespace: 'rdk',
		type: isComponent ? 'component' : 'service',
		subtype: 'generic',
		name: resourceName,
	})
</script>

<div class="flex flex-col py-2 pl-4">
	<SectionHeading
		method="DoCommand"
		{api}
	/>
</div>

{#key genericResourceName}
	<DoCommand
		{partID}
		resource={genericResourceName}
	/>
{/key}

<script lang="ts">
	import { ResourceName } from '@viamrobotics/sdk'

	import DoCommand from '../do-command/do-command.svelte'

	interface Props {
		partID: string
		resourceName: string
		isComponent: boolean
	}

	const { partID, resourceName, isComponent }: Props = $props()

	const genericResourceName = $derived<ResourceName>({
		namespace: 'rdk',
		type: isComponent ? 'component' : 'service',
		subtype: 'generic',
		name: resourceName,
	})
</script>

<div class="flex flex-col py-2 pl-4">
	<h3 class="font-semibold">DoCommand</h3>
</div>

{#key genericResourceName}
	<DoCommand
		{partID}
		resource={genericResourceName}
	/>
{/key}

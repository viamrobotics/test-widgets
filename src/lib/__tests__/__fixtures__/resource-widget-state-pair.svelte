<script lang="ts">
	import WidgetsProvider from '$lib/widgets-provider.svelte'

	import Probe from './resource-widget-state-probe.svelte'

	interface Props {
		partID: string
		firstResourceName: string
		secondResourceName: string
		onState: (label: string, state: object) => void
	}

	const { partID, firstResourceName, secondResourceName, onState }: Props = $props()
</script>

<WidgetsProvider>
	<Probe
		{partID}
		resourceName={firstResourceName}
		onState={(state) => onState('first', state)}
	/>
	<Probe
		{partID}
		resourceName={secondResourceName}
		onState={(state) => onState('second', state)}
	/>
</WidgetsProvider>

<script lang="ts">
	import WidgetsProvider from '#lib/WidgetsProvider.svelte'

	import Probe from './ResourceWidgetStateProbe.svelte'

	interface Props {
		partID: string
		resourceName: string
		onState: (label: string, state: object) => void
	}

	const { partID, resourceName, onState }: Props = $props()
</script>

<WidgetsProvider>
	<Probe
		{partID}
		{resourceName}
		onState={(state) => onState('first', state)}
	/>
</WidgetsProvider>
<WidgetsProvider>
	<Probe
		{partID}
		{resourceName}
		onState={(state) => onState('second', state)}
	/>
</WidgetsProvider>

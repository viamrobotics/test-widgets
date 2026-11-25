<script lang="ts">
	import WidgetsProvider from '#lib/WidgetsProvider.svelte'

	import Probe from './ResourceWidgetStateProbe.svelte'

	interface Target {
		partID: string
		resourceName: string
	}

	interface Props {
		first: Target
		second: Target
		onState: (label: string, state: object) => void
	}

	const { first, second, onState }: Props = $props()
</script>

<WidgetsProvider>
	<Probe
		partID={first.partID}
		resourceName={first.resourceName}
		onState={(state) => onState('first', state)}
	/>
	<Probe
		partID={second.partID}
		resourceName={second.resourceName}
		onState={(state) => onState('second', state)}
	/>
</WidgetsProvider>

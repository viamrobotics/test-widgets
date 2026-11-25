<script
	lang="ts"
	module
>
	const probeStateHook = defineResourceState('Probe', () => ({}))
</script>

<script lang="ts">
	import { untrack } from 'svelte'

	import { defineResourceState } from '$lib/resource-widget-state'

	interface Props {
		partID: string
		resourceName: string
		onState: (state: object) => void
	}

	const { partID, resourceName, onState }: Props = $props()

	const useProbeState = probeStateHook

	untrack(() => onState(useProbeState(partID, resourceName)))
</script>

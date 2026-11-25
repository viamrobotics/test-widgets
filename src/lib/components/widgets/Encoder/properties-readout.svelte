<script lang="ts">
	import type { EncoderProperties } from '@viamrobotics/sdk'

	import SupportRow from './support-row.svelte'

	interface Props {
		properties: EncoderProperties | undefined
	}

	const { properties }: Props = $props()
</script>

<SupportRow
	label="Ticks count"
	isSupported={properties?.ticksCountSupported}
/>
<SupportRow
	label="Angle degrees"
	isSupported={properties?.angleDegreesSupported}
/>

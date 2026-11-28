<!--
@component
Home's progress for one gantry, wherever Home renders on the page. Reads the shared gantry state,
so it sends nothing.
-->
<script lang="ts">
	import { Section } from '#lib/components/Section/index.js'
	import StatusLine from '#lib/components/StatusLine.svelte'
	import { untrack } from 'svelte'

	import { useGantryState } from './gantry-state.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const { homing } = untrack(() => useGantryState(partID, resourceName))
</script>

<Section class="grow flex-col gap-2">
	<Section.Heading>Homing status</Section.Heading>
	<Section.Body>
		<div
			class="flex min-w-0 items-center gap-2"
			aria-busy={homing.isHoming}
		>
			{#if homing.isHoming}
				<span
					class="progress-dots"
					aria-hidden="true"
				></span>
			{/if}
			<StatusLine text={homing.busyStatus} />
		</div>
	</Section.Body>
</Section>

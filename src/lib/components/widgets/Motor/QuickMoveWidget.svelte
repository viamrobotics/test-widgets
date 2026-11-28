<script lang="ts">
	import { MotorClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'
	import { Section, useSectionErrors } from '#lib/components/Section/index.js'
	import { untrack } from 'svelte'

	import { useMotorState } from './motor-state.svelte'
	import QuickMove from './QuickMove.svelte'
	import RpmHold from './RpmHold.svelte'

	interface Props {
		partID: string
		resourceName: string
		/**
		 * The most RPM a send may carry, from the gpio motor config's `max_rpm`, in revolutions per
		 * minute. Applies to the RPM hold of a motor that reports its position. Used only when finite
		 * and above 0. @default undefined
		 */
		maxRpm?: number
		/**
		 * The lowest power fraction the power slider reaches, from the gpio motor config's
		 * `min_power_pct`, a fraction from 0 to 1. Applies to the power hold of a motor that does not
		 * report its position. @default 0
		 */
		minPowerPct?: number
		/**
		 * The highest power fraction the power slider reaches, from the gpio motor config's
		 * `max_power_pct`, a fraction from 0 to 1. Applies to the power hold of a motor that does not
		 * report its position. @default 1
		 */
		maxPowerPct?: number
	}

	const { partID, resourceName, maxRpm, minPowerPct, maxPowerPct }: Props = $props()

	const client = createResourceClient(
		MotorClient,
		() => partID,
		() => resourceName
	)

	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })
	const setPowerMutation = createResourceMutation(client, 'setPower')
	const setRPMMutation = createResourceMutation(client, 'setRPM')
	const stopMutation = createResourceMutation(client, 'stop')
	const { motion } = untrack(() => useMotorState(partID, resourceName))

	const sectionErrors = useSectionErrors(() => ({
		queries: [propertiesQuery],
		mutations: [setPowerMutation, setRPMMutation, stopMutation],
	}))

	// A motor that reports its position holds at a speed, and one that does not holds at a power.
	const reportsPosition = $derived(propertiesQuery.data?.positionReporting === true)

	const stop = () => {
		stopMutation.mutate([], {})
	}
</script>

{#snippet controls()}
	<Section.Body isLoading={sectionErrors.isLoading}>
		{#if reportsPosition}
			<RpmHold
				{maxRpm}
				setRPM={(rpm) => {
					void motion.run(() => setRPMMutation.mutateAsync([rpm]))
				}}
				isBusy={motion.isBusy}
				onRelease={stop}
			/>
		{:else}
			<QuickMove
				{minPowerPct}
				{maxPowerPct}
				setPower={(power) => {
					void motion.run(() => setPowerMutation.mutateAsync([power]))
				}}
				isBusy={motion.isBusy}
				onRelease={stop}
			/>
		{/if}
	</Section.Body>
{/snippet}

<Section
	errorReporter={sectionErrors}
	class="flex-row flex-wrap gap-2"
>
	<div class="flex flex-col gap-0.5">
		<Section.Heading>
			Quick move
			{#snippet aside()}
				<Section.Errors errors={sectionErrors.errors} />
			{/snippet}
		</Section.Heading>
	</div>
	<div class="flex grow flex-wrap justify-between gap-2">
		{@render controls()}
	</div>
</Section>

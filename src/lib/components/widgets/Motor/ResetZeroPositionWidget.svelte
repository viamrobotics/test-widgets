<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { NumberField } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'
	import { MotorClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import { emptyOnClear } from '#lib/components/empty-on-clear.js'
	import { ResourceTriplets } from '#lib/resource-triplet.js'
	import { untrack } from 'svelte'

	import { useMotorState } from './motor-state.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const UNSUPPORTED_MESSAGE = 'This motor does not report its position.'
	const EMPTY_OFFSET_MESSAGE = 'Enter an offset to execute.'

	const hintId = $props.id()

	const client = createResourceClient(
		MotorClient,
		() => partID,
		() => resourceName
	)

	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })
	const resetMutation = createResourceMutation(client, 'resetZeroPosition')
	const { motion } = untrack(() => useMotorState(partID, resourceName))

	let offset = $state<number | undefined>(0)

	const isSupported = $derived(propertiesQuery.data?.positionReporting === true)
	// Typing is not clamped, so an emptied field holds back Execute.
	const validOffset: number | undefined = $derived(
		offset !== undefined && Number.isFinite(offset) ? offset : undefined
	)
	const canExecute = $derived(isSupported && validOffset !== undefined && !motion.isBusy)
	const disabledReason = $derived.by(() => {
		if (propertiesQuery.data?.positionReporting === false) return UNSUPPORTED_MESSAGE
		if (validOffset === undefined) return EMPTY_OFFSET_MESSAGE
		return undefined
	})
	const hintReference = $derived(disabledReason === undefined ? undefined : hintId)
</script>

<ApiSection
	method="ResetZeroPosition"
	api={ResourceTriplets.Motor}
	queries={[propertiesQuery]}
	mutations={[resetMutation]}
	class="grow flex-col gap-1"
>
	{#snippet tooltip()}
		ResetZeroPosition sets the current position of the motor as the new zero position. This method
		will return an error if position reporting is not supported.
	{/snippet}
	<div class="flex flex-wrap items-end gap-2">
		<NumberField
			class="min-w-40 flex-1"
			label="Offset"
			hint="The offset, in revolutions, from the current position to set as the new zero."
			suffix="rev"
			step={0.1}
			disabled={!isSupported}
			state={validOffset === undefined ? 'error' : undefined}
			aria-describedby={hintReference}
			{...emptyOnClear(() => (offset = undefined))}
			bind:value={offset}
		/>
		<button
			type="button"
			class="button button-compact ml-auto"
			disabled={!canExecute}
			aria-describedby={hintReference}
			onclick={() => {
				if (validOffset !== undefined) {
					void motion.run(() => resetMutation.mutateAsync([validOffset]))
				}
			}}
		>
			<Icon icon={mdiPlayCircleOutline} />
			Execute
		</button>
	</div>
	{#if disabledReason !== undefined}
		<span
			id={hintId}
			class="text-subtle-1 text-xs">{disabledReason}</span
		>
	{/if}
</ApiSection>

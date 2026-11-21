<script lang="ts">
	import { mdiPlayCircleOutline } from '@mdi/js'
	import { NumberField, ToggleButtons } from '@viamrobotics/prime-controls'
	import { Icon } from '@viamrobotics/prime-ui'
	import { MotorClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import { Section, useSectionErrors } from '$lib/components/section'
	import { errorKey } from '$lib/components/section/error-key'
	import StatusLine from '$lib/components/status-line.svelte'

	import { readValidRpm } from './read-valid-rpm'
	import RpmField from './rpm-field.svelte'

	interface Props {
		partID: string
		resourceName: string
		/**
		 * Draws the controls with no heading of their own, for a host that titles them, and adds
		 * their errors to the enclosing section's indicator. @default false
		 */
		isEmbedded?: boolean
		/**
		 * The most RPM a send may carry, from the gpio motor config's `max_rpm`, in revolutions per
		 * minute. The RPM field caps at it, and a value over it is flagged and not sent. Used only
		 * when finite and above 0. @default undefined
		 */
		maxRpm?: number
	}

	type Mode = 'relative' | 'absolute'

	const { partID, resourceName, isEmbedded = false, maxRpm }: Props = $props()

	const RELATIVE_MODE = 'relative'
	const ABSOLUTE_MODE = 'absolute'
	const MODE_ITEMS = [
		{ value: RELATIVE_MODE, label: 'Relative' },
		{ value: ABSOLUTE_MODE, label: 'Absolute' },
	]
	const DEFAULT_DISTANCE = 1
	const DEFAULT_RPM = 10
	const DISTANCE_STEP = 0.1
	const ZERO_OFFSET = 0
	const NO_POSITION_MESSAGE = 'This motor does not report its position.'

	const client = createResourceClient(
		MotorClient,
		() => partID,
		() => resourceName
	)

	const propertiesQuery = createResourceQuery(client, 'getProperties', { refetchInterval: false })
	const goForMutation = createResourceMutation(client, 'goFor')
	const goToMutation = createResourceMutation(client, 'goTo')
	const resetZeroMutation = createResourceMutation(client, 'resetZeroPosition')

	const sectionErrors = useSectionErrors(() => ({
		queries: [propertiesQuery],
		mutations: [goForMutation, goToMutation, resetZeroMutation],
	}))

	const hasNoPosition = $derived(propertiesQuery.data?.positionReporting === false)

	let mode = $state<Mode>(RELATIVE_MODE)
	let distance = $state<number | undefined>(DEFAULT_DISTANCE)
	let rpm = $state<number | undefined>(DEFAULT_RPM)

	const getMode = () => mode
	// A single-choice toggle reports an empty value when its pressed option is pressed again, which keeps the mode.
	const selectMode = (next: string | undefined) => {
		if (next === RELATIVE_MODE || next === ABSOLUTE_MODE) mode = next
	}

	// An empty field is `undefined`, so it holds back Execute.
	const validDistance: number | undefined = $derived(
		distance !== undefined && Number.isFinite(distance) ? distance : undefined
	)
	const validRpm: number | undefined = $derived(readValidRpm(rpm, maxRpm))

	const isMovePending = $derived(goForMutation.isPending || goToMutation.isPending)
	const canExecute = $derived(validDistance !== undefined && validRpm !== undefined)

	const distanceLabel = $derived(mode === RELATIVE_MODE ? 'Revolutions' : 'Target position')
	const distanceHint = $derived(
		mode === RELATIVE_MODE
			? 'Number of revolutions the motor will run for. Positive is forward, negative is backward.'
			: 'Target position the motor will turn to in revolutions from home/zero.'
	)

	const moveStatus = $derived.by(() => {
		if (goForMutation.isPending && goForMutation.variables !== undefined) {
			const [pendingRpm, revolutions] = goForMutation.variables
			return `Moving ${revolutions} rev at ${pendingRpm} RPM`
		}
		if (goToMutation.isPending && goToMutation.variables !== undefined) {
			const [pendingRpm, position] = goToMutation.variables
			return `Moving to ${position} rev at ${pendingRpm} RPM`
		}
		return ''
	})

	const execute = () => {
		if (isMovePending || validDistance === undefined || validRpm === undefined) return
		if (mode === RELATIVE_MODE) {
			goForMutation.mutate([validRpm, validDistance], {})
		} else {
			goToMutation.mutate([validRpm, validDistance], {})
		}
	}
</script>

{#snippet controls()}
	<Section.Body isLoading={sectionErrors.isLoading}>
		{#if hasNoPosition}
			<p class="text-subtle-1 text-xs">{NO_POSITION_MESSAGE}</p>
		{:else}
			<div class="flex w-full min-w-0 flex-col gap-1">
				<ToggleButtons
					label="Mode"
					items={MODE_ITEMS}
					bind:value={getMode, selectMode}
				/>
				<NumberField
					label={distanceLabel}
					hint={distanceHint}
					suffix="rev"
					step={DISTANCE_STEP}
					state={validDistance === undefined ? 'error' : undefined}
					bind:value={distance}
				/>
				<RpmField
					hint="Speed in revolutions per minute. The sign of the revolutions or the target sets the direction."
					{maxRpm}
					bind:value={rpm}
				/>
				<div class="mt-1 flex items-center gap-2">
					<button
						type="button"
						class="button button-xs"
						onclick={() => {
							resetZeroMutation.mutate([ZERO_OFFSET], {})
						}}
					>
						Reset zero
					</button>
					<button
						type="button"
						class="button button-compact ml-auto"
						aria-busy={isMovePending}
						disabled={!canExecute}
						onclick={execute}
					>
						{#if isMovePending}
							<span
								class="progress-dots"
								aria-hidden="true"
							></span>
						{:else}
							<Icon
								icon={mdiPlayCircleOutline}
								size="sm"
							/>
						{/if}
						Execute
					</button>
				</div>
				<StatusLine text={moveStatus} />
			</div>
		{/if}
	</Section.Body>
{/snippet}

{#if isEmbedded}
	{#each sectionErrors.errors as error (errorKey(error))}
		<Section.Error {error} />
	{/each}
	{@render controls()}
{:else}
	<Section
		errorReporter={sectionErrors}
		class="flex-col gap-2"
	>
		<Section.Heading>
			Move
			{#snippet aside()}
				<Section.Errors errors={sectionErrors.errors} />
			{/snippet}
		</Section.Heading>
		{@render controls()}
	</Section>
{/if}

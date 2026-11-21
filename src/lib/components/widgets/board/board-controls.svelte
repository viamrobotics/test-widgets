<!--
@component
The board's control interface: named pins, analog readers, and digital interrupts the person adds,
then one Power mode row. Names persist per board. One status line shows the latest row text.
-->
<script lang="ts">
	import { TextField } from '@viamrobotics/prime-controls'
	import { PersistedState } from 'runed'
	import { untrack } from 'svelte'

	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import { Section, useSectionErrors } from '$lib/components/section'
	import StatusLine from '$lib/components/status-line.svelte'

	import BoardAnalogReaderRow from './board-analog-reader-row.svelte'
	import BoardDigitalInterruptRow from './board-digital-interrupt-row.svelte'
	import BoardPinRow from './board-pin-row.svelte'
	import BoardPowerModeRow from './board-power-mode-row.svelte'

	interface Props {
		partID: string
		resourceName: string
		/** Seeds the analog reader list when nothing is stored for this board. */
		analogReaders?: string[]
		/** Seeds the digital interrupt list when nothing is stored for this board. */
		digitalInterrupts?: string[]
	}

	const { partID, resourceName, analogReaders = [], digitalInterrupts = [] }: Props = $props()

	const id = $props.id()

	const sectionErrors = useSectionErrors(() => ({}))

	const storeFor = (kind: string, getSeed: () => string[]) => {
		const key = $derived(`board-controls/${partID}/${resourceName}/${kind}`)
		const persisted = $derived(new PersistedState<string[]>(key, untrack(getSeed)))
		return {
			get current() {
				return persisted.current
			},
			set current(names: string[]) {
				persisted.current = names
			},
		}
	}

	const pins = storeFor('pins', () => [])
	const analogs = storeFor('analog-readers', () => analogReaders)
	const interrupts = storeFor('digital-interrupts', () => digitalInterrupts)

	// Reported row text, oldest first. The line shows the last entry.
	let reports = $state<{ key: string; text: string }[]>([])

	// Rows report from effects, so this write must not subscribe the calling effect to `reports`.
	const report = (key: string, text: string) => {
		const others = untrack(() => reports).filter((entry) => entry.key !== key)
		reports = text === '' ? others : [...others, { key, text }]
	}

	const statusText = $derived(reports.at(-1)?.text ?? '')

	let pinDraft = $state('')
	let analogDraft = $state('')
	let interruptDraft = $state('')

	const addTo = (store: { current: string[] }, draft: string, clearDraft: () => void) => {
		const name = draft.trim()
		if (name === '' || store.current.includes(name)) return
		store.current = [...store.current, name]
		clearDraft()
	}

	const removeFrom = (store: { current: string[] }, name: string, reportKey: string) => {
		store.current = store.current.filter((existing) => existing !== name)
		report(reportKey, '')
	}
</script>

{#snippet addRow(
	label: string,
	placeholder: string,
	addLabel: string,
	getDraft: () => string,
	setDraft: (value: string) => void,
	onadd: () => void
)}
	<form
		class="flex flex-wrap items-center gap-x-2 gap-y-1"
		onsubmit={(event) => {
			event.preventDefault()
			onadd()
		}}
	>
		<TextField
			class="min-w-40 flex-1"
			{label}
			{placeholder}
			bind:value={getDraft, setDraft}
		/>
		<button
			type="submit"
			class="button button-xs"
			aria-label={addLabel}
		>
			Add
		</button>
	</form>
{/snippet}

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="@container min-w-0">
			<Section
				errorReporter={sectionErrors}
				class="min-w-0 flex-col gap-3 p-2"
			>
				<Section.Heading class="justify-between">
					Controls
					{#snippet aside()}
						<Section.Errors errors={sectionErrors.errors} />
					{/snippet}
				</Section.Heading>

				<div class="flex w-full min-w-0 flex-col gap-1">
					<div class="flex min-w-0 flex-col gap-4">
						<section
							aria-labelledby={`${id}-pins`}
							class="flex flex-col gap-2"
						>
							<h4
								id={`${id}-pins`}
								class="text-xs font-semibold"
							>
								Pins
							</h4>
							{@render addRow(
								'Pin',
								'11',
								'Add pin',
								() => pinDraft,
								(value) => (pinDraft = value),
								() => addTo(pins, pinDraft, () => (pinDraft = ''))
							)}
							{#each pins.current as name (name)}
								<BoardPinRow
									{partID}
									{resourceName}
									{name}
									onRemove={() => removeFrom(pins, name, `pin:${name}`)}
									onStatusChange={(text) => report(`pin:${name}`, text)}
								/>
							{/each}
						</section>

						<section
							aria-labelledby={`${id}-analog`}
							class="flex flex-col gap-2"
						>
							<h4
								id={`${id}-analog`}
								class="text-xs font-semibold"
							>
								Analog readers
							</h4>
							{@render addRow(
								'Reader',
								'a1',
								'Add reader',
								() => analogDraft,
								(value) => (analogDraft = value),
								() => addTo(analogs, analogDraft, () => (analogDraft = ''))
							)}
							{#each analogs.current as name (name)}
								<BoardAnalogReaderRow
									{partID}
									{resourceName}
									{name}
									onRemove={() => removeFrom(analogs, name, `analog:${name}`)}
									onStatusChange={(text) => report(`analog:${name}`, text)}
								/>
							{/each}
						</section>

						<section
							aria-labelledby={`${id}-interrupts`}
							class="flex flex-col gap-2"
						>
							<h4
								id={`${id}-interrupts`}
								class="text-xs font-semibold"
							>
								Digital interrupts
							</h4>
							{@render addRow(
								'Interrupt',
								'd1',
								'Add interrupt',
								() => interruptDraft,
								(value) => (interruptDraft = value),
								() => addTo(interrupts, interruptDraft, () => (interruptDraft = ''))
							)}
							{#each interrupts.current as name (name)}
								<BoardDigitalInterruptRow
									{partID}
									{resourceName}
									{name}
									onRemove={() => removeFrom(interrupts, name, `interrupt:${name}`)}
									onStatusChange={(text) => report(`interrupt:${name}`, text)}
								/>
							{/each}
						</section>

						<section
							aria-labelledby={`${id}-power-mode`}
							class="flex flex-col gap-2"
						>
							<h4
								id={`${id}-power-mode`}
								class="text-xs font-semibold"
							>
								Power mode
							</h4>
							<BoardPowerModeRow
								{partID}
								{resourceName}
								onStatusChange={(text) => report('power-mode', text)}
							/>
						</section>
					</div>
					<StatusLine text={statusText} />
				</div>
			</Section>
		</div>
	{/snippet}
</ConnectionStatus>

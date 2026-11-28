<!--
@component
The pins the person adds by name, each with its level and Read, High and Low, its duty cycle, and
its frequency. Names persist per board. Writes share each pin's conflict group with SetGpio, SetPwm,
and SetPwmFrequency. The status line shows the latest row text.
-->
<script lang="ts">
	import { Section, useSectionErrors } from '#lib/components/Section/index.js'
	import StatusLine from '#lib/components/StatusLine.svelte'

	import { useBoardNameList } from './board-name-list.svelte'
	import { createBoardStatusReports } from './board-status-reports.svelte'
	import BoardNameAddForm from './BoardNameAddForm.svelte'
	import BoardPinEntry from './BoardPinEntry.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const sectionErrors = useSectionErrors(() => ({}))

	const pins = useBoardNameList(
		() => partID,
		() => resourceName,
		'pins'
	)
	const statusReports = createBoardStatusReports()

	const removePin = (name: string) => {
		pins.remove(name)
		statusReports.report(name, '')
	}
</script>

<Section
	errorReporter={sectionErrors}
	class="grow flex-col gap-3"
>
	<Section.Heading>
		Pin
		{#snippet aside()}
			<Section.Errors errors={sectionErrors.errors} />
		{/snippet}
	</Section.Heading>
	<Section.Body>
		<div class="flex w-full min-w-0 flex-col gap-1">
			<BoardNameAddForm
				label="Pin"
				placeholder="11"
				addLabel="Add pin"
				onAdd={pins.add}
			/>
			{#each pins.names as name (name)}
				<BoardPinEntry
					{partID}
					{resourceName}
					{name}
					onRemove={() => removePin(name)}
					onStatusChange={(text) => statusReports.report(name, text)}
				/>
			{/each}
			<StatusLine text={statusReports.text} />
		</div>
	</Section.Body>
</Section>

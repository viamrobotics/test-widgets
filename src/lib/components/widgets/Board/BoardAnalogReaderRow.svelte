<!--
@component
The analog readers the person adds by name, each with its polled value on a range track from the
reader's minimum to maximum. Reads only. Names persist per board. The status line shows the latest
row text.
-->
<script lang="ts">
	import { Section, useSectionErrors } from '#lib/components/Section/index.js'
	import StatusLine from '#lib/components/StatusLine.svelte'

	import { useBoardNameList } from './board-name-list.svelte'
	import { createBoardStatusReports } from './board-status-reports.svelte'
	import BoardAnalogReaderEntry from './BoardAnalogReaderEntry.svelte'
	import BoardNameAddForm from './BoardNameAddForm.svelte'

	interface Props {
		partID: string
		resourceName: string
		/** Seeds the analog reader list when nothing is stored for this board. */
		analogReaders?: string[]
	}

	const { partID, resourceName, analogReaders = [] }: Props = $props()

	const sectionErrors = useSectionErrors(() => ({}))

	const readers = useBoardNameList(
		() => partID,
		() => resourceName,
		'analog-readers',
		() => analogReaders
	)
	const statusReports = createBoardStatusReports()

	const removeReader = (name: string) => {
		readers.remove(name)
		statusReports.report(name, '')
	}
</script>

<Section
	errorReporter={sectionErrors}
	class="grow flex-col gap-3"
>
	<Section.Heading>
		Analog reader
		{#snippet aside()}
			<Section.Errors errors={sectionErrors.errors} />
		{/snippet}
	</Section.Heading>
	<Section.Body>
		<div class="flex w-full min-w-0 flex-col gap-1">
			<BoardNameAddForm
				label="Reader"
				placeholder="a1"
				addLabel="Add reader"
				onAdd={readers.add}
			/>
			{#each readers.names as name (name)}
				<BoardAnalogReaderEntry
					{partID}
					{resourceName}
					{name}
					onRemove={() => removeReader(name)}
					onStatusChange={(text) => statusReports.report(name, text)}
				/>
			{/each}
			<StatusLine text={statusReports.text} />
		</div>
	</Section.Body>
</Section>

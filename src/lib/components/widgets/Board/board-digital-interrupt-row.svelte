<!--
@component
The digital interrupts the person adds by name, each with its polled count. Reads only. Names
persist per board. The status line shows the latest row text.
-->
<script lang="ts">
	import { Section, useSectionErrors } from '$lib/components/section'
	import StatusLine from '$lib/components/status-line.svelte'

	import BoardDigitalInterruptEntry from './board-digital-interrupt-entry.svelte'
	import BoardNameAddForm from './board-name-add-form.svelte'
	import { useBoardNameList } from './board-name-list.svelte'
	import { createBoardStatusReports } from './board-status-reports.svelte'

	interface Props {
		partID: string
		resourceName: string
		/** Seeds the digital interrupt list when nothing is stored for this board. */
		digitalInterrupts?: string[]
	}

	const { partID, resourceName, digitalInterrupts = [] }: Props = $props()

	const sectionErrors = useSectionErrors(() => ({}))

	const interrupts = useBoardNameList(
		() => partID,
		() => resourceName,
		'digital-interrupts',
		() => digitalInterrupts
	)
	const statusReports = createBoardStatusReports()

	const removeInterrupt = (name: string) => {
		interrupts.remove(name)
		statusReports.report(name, '')
	}
</script>

<Section
	errorReporter={sectionErrors}
	class="grow flex-col gap-3"
>
	<Section.Heading>
		Digital interrupt
		{#snippet aside()}
			<Section.Errors errors={sectionErrors.errors} />
		{/snippet}
	</Section.Heading>
	<Section.Body>
		<div class="flex w-full min-w-0 flex-col gap-1">
			<BoardNameAddForm
				label="Interrupt"
				placeholder="d1"
				addLabel="Add interrupt"
				onAdd={interrupts.add}
			/>
			{#each interrupts.names as name (name)}
				<BoardDigitalInterruptEntry
					{partID}
					{resourceName}
					{name}
					onRemove={() => removeInterrupt(name)}
					onStatusChange={(text) => statusReports.report(name, text)}
				/>
			{/each}
			<StatusLine text={statusReports.text} />
		</div>
	</Section.Body>
</Section>

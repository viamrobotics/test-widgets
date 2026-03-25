<script lang="ts">
	import AngleUnitToggle from '$lib/components/angle-unit-toggle.svelte'
	import CopyButton from '$lib/components/copy-button.svelte'
	import Table from '$lib/components/table.svelte'
	import { degreesToRadians, formatNumeric } from '$lib/format'

	interface Props {
		positions: number[]
	}

	const { positions }: Props = $props()

	let useRadians = $state(false)

	const displayPositions = $derived(
		positions.map((pos) => (useRadians ? degreesToRadians(pos) : pos))
	)

	const copyData = $derived(`[${displayPositions.join(', ')}]`)
</script>

<div class="flex min-w-0 flex-col gap-4">
	<!-- Controls Header -->
	<div class="flex items-center justify-between">
		<span class="text-sm">Current Positions</span>
		<div class="flex gap-1">
			<AngleUnitToggle
				{useRadians}
				onToggle={() => {
					useRadians = !useRadians
				}}
			/>
			<CopyButton data={copyData} />
		</div>
	</div>

	<Table>
		<thead>
			<tr>
				<th> Joint </th>
				<th>Position ({useRadians ? 'radians' : 'degrees'})</th>
			</tr>
		</thead>
		<tbody>
			{#each displayPositions as pos, index (pos)}
				<tr>
					<th> {index} </th>
					<th> {formatNumeric(pos)} </th>
				</tr>
			{/each}
		</tbody>
	</Table>
</div>

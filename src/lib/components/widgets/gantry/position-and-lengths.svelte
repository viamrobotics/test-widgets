<script lang="ts">
	import Table from '$lib/components/table.svelte'
	import { formatNumeric } from '$lib/format'

	interface Props {
		positions: number[]
		lengths: number[]
	}

	const { positions, lengths }: Props = $props()

	const maxLength = $derived(Math.max(positions.length, lengths.length))
</script>

<Table>
	<thead>
		<tr>
			<th> Axis </th>
			<th> Position <abbr>(mm)</abbr> </th>
			<th> Length <abbr>(mm)</abbr> </th>
		</tr>
	</thead>
	<tbody>
		{#each { length: maxLength }, index (index)}
			<tr>
				<th> {index} </th>
				<th> {formatNumeric(positions[index])} </th>
				<th> {formatNumeric(lengths[index])} </th>
			</tr>
		{/each}
	</tbody>
</Table>

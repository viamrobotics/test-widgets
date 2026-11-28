<script lang="ts">
	import AngleUnitToggle from '#lib/components/AngleUnitToggle.svelte'
	import CopyButton from '#lib/components/CopyButton.svelte'
	import { degreesToRadians, formatNumeric } from '#lib/format.js'

	interface Props {
		positions: number[]
	}

	const { positions }: Props = $props()

	let useRadians = $state(false)

	const displayPositions = $derived(
		positions.map((pos) => (useRadians ? degreesToRadians(pos) : pos))
	)

	const labelId = $props.id()

	const copyData = $derived(`[${displayPositions.join(', ')}]`)
</script>

<div class="flex min-w-0 flex-col gap-3">
	<div class="flex items-center gap-1">
		<span
			id={labelId}
			class="text-subtle-1 min-w-0 flex-1 truncate text-xs"
		>
			Current Positions
		</span>
		<AngleUnitToggle
			{useRadians}
			onToggle={() => {
				useRadians = !useRadians
			}}
		/>
		<CopyButton data={copyData} />
	</div>

	<div
		role="group"
		aria-labelledby={labelId}
		class="flex flex-col gap-1"
	>
		<!-- joint ids are just the index in the list of values, we need to use index for the key -->
		{#each displayPositions as pos, index (index)}
			<div class="flex min-w-0 items-center gap-2">
				<span class="text-subtle-1 w-14 shrink-0 text-xs">Joint {index}</span>
				<span class="readout font-roboto-mono">
					<span class="readout-value">{formatNumeric(pos)}</span>
					<span class="readout-suffix">{useRadians ? 'rad' : '°'}</span>
				</span>
			</div>
		{/each}
	</div>
</div>

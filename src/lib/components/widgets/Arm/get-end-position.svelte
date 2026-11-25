<script lang="ts">
	import type { Pose } from '@viamrobotics/sdk'

	import CopyButton from '$lib/components/copy-button.svelte'
	import { formatNumeric } from '$lib/format'

	interface Props {
		pose: Pose | undefined
	}

	const { pose }: Props = $props()

	const MISSING_VALUE = '-'

	const positionCells = $derived([
		{ tag: 'X', value: pose?.x },
		{ tag: 'Y', value: pose?.y },
		{ tag: 'Z', value: pose?.z },
	])

	const orientationCells = $derived([
		{ tag: 'OX', value: pose?.oX },
		{ tag: 'OY', value: pose?.oY },
		{ tag: 'OZ', value: pose?.oZ },
		{ tag: 'Theta', value: pose?.theta },
	])

	const copyData = $derived(
		pose
			? JSON.stringify({
					x: pose.x,
					y: pose.y,
					z: pose.z,
					oX: pose.oX,
					oY: pose.oY,
					oZ: pose.oZ,
					theta: pose.theta,
				})
			: ''
	)

	const labelId = $props.id()
	const positionLabelId = $derived(`${labelId}-position`)
	const orientationLabelId = $derived(`${labelId}-orientation`)
</script>

{#snippet cells(
	items: { tag: string; value: number | undefined }[],
	suffix: string,
	columns: string
)}
	<div class={['grid gap-1', columns]}>
		{#each items as item (item.tag)}
			{@const cellLabelId = `${labelId}-${item.tag}`}
			<!-- The axis letter sits inside the box and the unit at its right edge, as a Point field draws them. -->
			<div
				role="group"
				aria-labelledby={cellLabelId}
				class="readout font-roboto-mono"
			>
				<span
					id={cellLabelId}
					class="font-public-sans text-subtle-1 shrink-0">{item.tag}</span
				>
				<span class="readout-value">
					{item.value === undefined ? MISSING_VALUE : formatNumeric(item.value)}
				</span>
				<span class="readout-suffix">{item.value === undefined ? '' : suffix}</span>
			</div>
		{/each}
	</div>
{/snippet}

<div class="flex min-w-0 flex-col gap-3">
	<div class="flex items-center gap-1">
		<span
			id={labelId}
			class="text-subtle-1 min-w-0 flex-1 truncate text-xs"
		>
			Current Pose
		</span>
		{#if pose}
			<CopyButton data={copyData} />
		{/if}
	</div>

	<div
		role="group"
		aria-labelledby={labelId}
		class="flex flex-col gap-2"
	>
		<div
			role="group"
			aria-labelledby={positionLabelId}
			class="flex flex-col gap-1"
		>
			<span
				id={positionLabelId}
				class="text-subtle-1 text-xs"
			>
				Position
			</span>
			{@render cells(positionCells, 'mm', 'grid-cols-3')}
		</div>
		<div
			role="group"
			aria-labelledby={orientationLabelId}
			class="flex flex-col gap-1"
		>
			<span
				id={orientationLabelId}
				class="text-subtle-1 text-xs"
			>
				Orientation
			</span>
			{@render cells(orientationCells, '°', 'grid-cols-4')}
		</div>
	</div>
</div>

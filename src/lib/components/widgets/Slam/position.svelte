<script lang="ts">
	import type { SlamPosition } from '@viamrobotics/sdk'

	import { mdiContentCopy } from '@mdi/js'
	import { Icon } from '@viamrobotics/prime-ui'

	import { formatNumeric } from '$lib/format'

	interface Props {
		position: SlamPosition
	}

	const { position }: Props = $props()

	const MM_PER_M = 1000

	// Position is returned in millimeters, but we display meters
	const pose = $derived(
		position.pose
			? {
					oX: position.pose.oX,
					oY: position.pose.oY,
					oZ: position.pose.oZ,
					theta: position.pose.theta,
					x: position.pose.x / MM_PER_M,
					y: position.pose.y / MM_PER_M,
					z: position.pose.z / MM_PER_M,
				}
			: undefined
	)

	const positionReadouts = $derived([
		{ label: 'x', value: pose?.x, suffix: 'm' },
		{ label: 'y', value: pose?.y, suffix: 'm' },
		{ label: 'z', value: pose?.z, suffix: 'm' },
	])

	const orientationReadouts = $derived([
		{ label: 'x', value: pose?.oX, suffix: undefined },
		{ label: 'y', value: pose?.oY, suffix: undefined },
		{ label: 'z', value: pose?.oZ, suffix: undefined },
		{ label: 'θ', value: pose?.theta, suffix: '°' },
	])

	const copyToClipboard = async () => {
		await globalThis.navigator.clipboard.writeText(JSON.stringify(pose))
	}
</script>

{#snippet readoutRows(
	rows: { label: string; value: number | undefined; suffix: string | undefined }[]
)}
	{#each rows as row (row.label)}
		<div class="flex min-w-0 items-center gap-2">
			<dt class="text-subtle-1 w-31 shrink-0 truncate text-xs">{row.label}</dt>
			<dd class="readout font-roboto-mono">
				<span class="readout-value">{formatNumeric(row.value, 1)}</span>
				{#if row.suffix !== undefined && row.value !== undefined}
					<span class="readout-suffix">{row.suffix}</span>
				{/if}
			</dd>
		</div>
	{/each}
{/snippet}

<div class="flex flex-col gap-2">
	<div
		role="group"
		aria-label="Current position"
		class="flex flex-col gap-1"
	>
		<span class="text-xs font-semibold">Current position</span>
		<dl class="flex flex-col gap-1">
			{@render readoutRows(positionReadouts)}
		</dl>
	</div>

	<div
		role="group"
		aria-label="Current orientation"
		class="flex flex-col gap-1"
	>
		<span class="text-xs font-semibold">Current orientation</span>
		<dl class="flex flex-col gap-1">
			{@render readoutRows(orientationReadouts)}
		</dl>
	</div>

	<div class="flex items-start">
		<button
			type="button"
			class="button button-compact"
			onclick={copyToClipboard}
		>
			<Icon
				icon={mdiContentCopy}
				size="sm"
			/>
			Copy pose to clipboard
		</button>
	</div>
</div>

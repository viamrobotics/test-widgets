<script lang="ts">
	import type { SlamPosition } from '@viamrobotics/sdk'

	import { mdiContentCopy } from '@mdi/js'
	import { Icon } from '@viamrobotics/prime-ui'
	import HeldBack from '#lib/components/HeldBack.svelte'
	import { formatNumeric } from '#lib/format.js'

	interface Props {
		position: SlamPosition
	}

	const { position }: Props = $props()

	const LENGTH_DIGITS = 2
	// The orientation vector's parts run from -1 to 1, so they need more digits to tell apart.
	const VECTOR_DIGITS = 4

	interface ReadoutRow {
		label: string
		value: number | undefined
		digits: number
		suffix: string | undefined
	}

	// The pose as the method returns it: millimeters, and an orientation vector with theta in degrees.
	const pose = $derived(
		position.pose
			? {
					x: position.pose.x,
					y: position.pose.y,
					z: position.pose.z,
					oX: position.pose.oX,
					oY: position.pose.oY,
					oZ: position.pose.oZ,
					theta: position.pose.theta,
				}
			: undefined
	)

	const positionReadouts = $derived<ReadoutRow[]>([
		{ label: 'x', value: pose?.x, digits: LENGTH_DIGITS, suffix: 'mm' },
		{ label: 'y', value: pose?.y, digits: LENGTH_DIGITS, suffix: 'mm' },
		{ label: 'z', value: pose?.z, digits: LENGTH_DIGITS, suffix: 'mm' },
	])

	const orientationReadouts = $derived<ReadoutRow[]>([
		{ label: 'x', value: pose?.oX, digits: VECTOR_DIGITS, suffix: undefined },
		{ label: 'y', value: pose?.oY, digits: VECTOR_DIGITS, suffix: undefined },
		{ label: 'z', value: pose?.oZ, digits: VECTOR_DIGITS, suffix: undefined },
		{ label: 'θ', value: pose?.theta, digits: LENGTH_DIGITS, suffix: '°' },
	])

	const copyBlockedReason = $derived(pose === undefined ? 'There is no pose to copy.' : undefined)

	const copyToClipboard = async () => {
		if (pose === undefined) return
		await globalThis.navigator.clipboard.writeText(JSON.stringify(pose))
	}
</script>

{#snippet readoutRows(rows: ReadoutRow[])}
	{#each rows as row (row.label)}
		<div class="flex min-w-0 items-center gap-2">
			<dt class="text-subtle-1 w-31 shrink-0 truncate text-xs">{row.label}</dt>
			<dd class="readout font-roboto-mono">
				<span class="readout-value">{formatNumeric(row.value, row.digits)}</span>
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
		<HeldBack reason={copyBlockedReason}>
			{#snippet children(heldBack)}
				<button
					type="button"
					class="button button-compact"
					{...heldBack}
					onclick={copyToClipboard}
				>
					<Icon
						icon={mdiContentCopy}
						size="sm"
					/>
					Copy pose to clipboard
				</button>
			{/snippet}
		</HeldBack>
	</div>
</div>

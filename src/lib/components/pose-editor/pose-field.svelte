<script lang="ts">
	import type { Snippet } from 'svelte'

	import { Icon, Label, Tooltip } from '@viamrobotics/prime-core'

	import { formatNumeric } from '$lib/format'

	import type { PoseFieldStatus, PoseStatusMessage } from './pose-field-status'

	import ScrubInput from './scrub-input.svelte'

	interface Props {
		value: number
		id: string
		label: string
		details?: string
		unit?: string
		step: number
		status?: PoseFieldStatus
		statusMessage?: Snippet<[PoseStatusMessage]>
		onreset?: () => void
	}

	let {
		value = $bindable(),
		id,
		label,
		details: labelSuffix,
		unit,
		step,
		status,
		statusMessage,
		onreset,
	}: Props = $props()

	const decimals = $derived(String(step).split('.')[1]?.length ?? 0)
	const display = $derived(Number(value.toFixed(decimals)))
	const text = $derived(status ? status.current.toFixed(decimals) : '')

	const message = $derived.by((): PoseStatusMessage | undefined => {
		if (status?.drift !== undefined) {
			const suffix = unit ? ` ${unit}` : ''
			return { kind: 'drift', label, amount: `${formatNumeric(status.drift)}${suffix}` }
		}

		if (status?.isEdited && status.isMoving) return { kind: 'moving', label, amount: '' }
		return undefined
	})

	const neutralMessage = (details: PoseStatusMessage) =>
		details.kind === 'drift'
			? `Moved ${details.amount} since you edited ${details.label}.`
			: 'Moving. Your edit is kept.'

	const state = $derived.by(() => {
		if (status?.drift !== undefined) return 'warn'
		if (status?.isEdited && status.isMoving) return 'info'
		return undefined
	})

	const currentId = $derived(`${id}-current`)
</script>

{#snippet messageText(details: PoseStatusMessage)}
	{#if statusMessage}
		{@render statusMessage(details)}
	{:else}
		{neutralMessage(details)}
	{/if}
{/snippet}

<div class="grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-2 @sm:flex @sm:w-20 @sm:flex-col @sm:gap-1">
	<div class="col-start-1 row-start-1 self-center">
		<Label for={id}>{label}{labelSuffix ? ` (${labelSuffix})` : ''}</Label>
	</div>
	<div class="col-start-2 row-start-1 min-w-0">
		<Tooltip
			state={message ? undefined : 'invisible'}
			targetClass="block"
		>
			<ScrubInput
				{id}
				{step}
				{state}
				bind:value={() => display, (next) => (value = next)}
				aria-describedby={status ? currentId : undefined}
			/>
			<span slot="description">
				{#if message}{@render messageText(message)}{/if}
			</span>
		</Tooltip>
		{#if status}
			<span
				id={currentId}
				class="sr-only"
			>
				Current {text}{#if message}. {@render messageText(message)}{/if}
			</span>
		{/if}
	</div>
	{#if status}
		<button
			type="button"
			aria-label="Reset {label} to its current value, {text}"
			tabindex={status.isEdited ? 0 : -1}
			class={[
				'font-roboto-mono col-start-2 row-start-2 inline-flex items-center gap-1 self-start rounded px-1 py-1 text-xs',
				'hover:bg-ghost-light active:bg-ghost-medium',
				'focus-visible:ring-gray-9 focus-visible:ring-2 focus-visible:outline-none',
				status.isEdited ? 'text-subtle-1' : 'text-disabled',
			]}
			onclick={onreset}
		>
			<Icon
				name="backup-restore"
				size="xs"
			/>
			{text}
		</button>
	{/if}
</div>

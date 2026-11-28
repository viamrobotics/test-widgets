<script lang="ts">
	import { TextField } from '@viamrobotics/prime-controls'
	import { BoardClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import ApiSection from '#lib/components/ApiSection.svelte'
	import HeldBack from '#lib/components/HeldBack.svelte'
	import { formatNumeric } from '#lib/format.js'
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const MISSING_VALUE = '-'
	const MISSING_NAME_REASON = 'Enter a digital interrupt name.'
	const INTERRUPT_PLACEHOLDER = 'd1'

	const client = createResourceClient(
		BoardClient,
		() => partID,
		() => resourceName
	)

	// A read the user asks for, so it is a mutation rather than a polled query.
	const getValueMutation = createResourceMutation(client, 'getDigitalInterruptValue')

	let interrupt = $state('')
	let latestCount = $state.raw<{ interrupt: string; value: number }>()

	const trimmedInterrupt = $derived(interrupt.trim())
	const blockedReason = $derived(trimmedInterrupt === '' ? MISSING_NAME_REASON : undefined)
	// A count belongs to the interrupt it came from, so it hides when the name changes.
	const count = $derived(
		latestCount?.interrupt === trimmedInterrupt ? latestCount.value : undefined
	)
	const countText = $derived(count === undefined ? MISSING_VALUE : formatNumeric(count, 0))

	const getValue = async () => {
		if (trimmedInterrupt === '') return
		const interruptToRead = trimmedInterrupt
		try {
			const value = await getValueMutation.mutateAsync([interruptToRead])
			latestCount = { interrupt: interruptToRead, value }
		} catch {
			// The mutation's error reaches the section's indicator.
		}
	}
</script>

<ApiSection
	class="flex-col gap-2"
	method="GetDigitalInterruptValue"
	api={ResourceTriplets.Board}
	mutations={[getValueMutation]}
>
	<div class="flex flex-wrap items-end gap-2">
		<TextField
			class="min-w-40 flex-1"
			label="Digital interrupt"
			placeholder={INTERRUPT_PLACEHOLDER}
			bind:value={interrupt}
		/>
		<div class="ml-auto">
			<HeldBack reason={blockedReason}>
				{#snippet children(heldBack)}
					<button
						type="button"
						class="button button-compact"
						{...heldBack}
						onclick={getValue}
					>
						Get
					</button>
				{/snippet}
			</HeldBack>
		</div>
	</div>
	<div
		role="group"
		aria-label="Value"
		class="flex items-center gap-2"
	>
		<span class="text-subtle-1 text-xs">Value</span>
		<output class="readout font-roboto-mono">
			<span class="readout-value">{countText}</span>
		</output>
	</div>
</ApiSection>

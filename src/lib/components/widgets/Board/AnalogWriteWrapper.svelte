<script lang="ts">
	import { BoardClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import { untrack } from 'svelte'

	import AnalogWrite from './AnalogWrite.svelte'
	import { useBoardState } from './board-state.svelte'
	import { missingPinReason } from './pin-held-back-reason'
	import { toError } from './to-error'

	interface Props {
		pin: string
		partID: string
		resourceName: string
		setLastError: (error: Error | null) => void
	}

	const { pin, partID, resourceName, setLastError }: Props = $props()

	const client = createResourceClient(
		BoardClient,
		() => partID,
		() => resourceName
	)
	const setValueMutation = createResourceMutation(client, 'writeAnalog')

	const { analogWriterGuard } = untrack(() => useBoardState(partID, resourceName))
	const trimmedPin = $derived(pin.trim())
	const guard = $derived(analogWriterGuard(trimmedPin))
	const blockedReason = $derived(trimmedPin === '' ? missingPinReason(false) : undefined)

	// Resolves `false` for a press dropped while the writer's group is busy, so the button shows no check.
	const setValue = async (value: number) => {
		const outcome = guard.run(async () => {
			try {
				await setValueMutation.mutateAsync([trimmedPin, value])
				setLastError(null)
			} catch (error) {
				setLastError(toError(error))
				throw error
			}
		})
		if (outcome === undefined) return false
		return (await outcome) === 'succeeded'
	}
</script>

<AnalogWrite
	{setValue}
	isBusy={guard.isBusy}
	{blockedReason}
/>

<script lang="ts">
	import { BoardClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import { untrack } from 'svelte'

	import { useBoardState } from './board-state.svelte'
	import GpioWrite from './GpioWrite.svelte'
	import { missingPinReason } from './pin-held-back-reason'
	import { toError } from './to-error'

	interface Props {
		partID: string
		resourceName: string
		pin: string
		setLastError: (error: Error | null) => void
	}

	const { pin, partID, resourceName, setLastError }: Props = $props()

	const client = createResourceClient(
		BoardClient,
		() => partID,
		() => resourceName
	)
	const setStateMutation = createResourceMutation(client, 'setGPIO')
	const setDutyCycleMutation = createResourceMutation(client, 'setPWM')
	const setFrequencyMutation = createResourceMutation(client, 'setPWMFrequency')

	const { pinGuard } = untrack(() => useBoardState(partID, resourceName))
	const trimmedPin = $derived(pin.trim())
	const guard = $derived(pinGuard(trimmedPin))
	const blockedReason = $derived(trimmedPin === '' ? missingPinReason(false) : undefined)

	// Resolves `false` for a press dropped while the pin's group is busy, so the button shows no check.
	const writeOnPin = async (write: () => Promise<unknown>) => {
		const outcome = guard.run(async () => {
			try {
				await write()
				setLastError(null)
			} catch (error) {
				setLastError(toError(error))
				throw error
			}
		})
		if (outcome === undefined) return false
		return (await outcome) === 'succeeded'
	}

	const setState = (isHigh: boolean) =>
		writeOnPin(() => setStateMutation.mutateAsync([trimmedPin, isHigh]))
	const setDutyCycle = (dutyCycleFraction: number) =>
		writeOnPin(() => setDutyCycleMutation.mutateAsync([trimmedPin, dutyCycleFraction]))
	const setFrequency = (frequencyHz: number) =>
		writeOnPin(() => setFrequencyMutation.mutateAsync([trimmedPin, frequencyHz]))
</script>

<GpioWrite
	{setState}
	{setDutyCycle}
	{setFrequency}
	isBusy={guard.isBusy}
	{blockedReason}
/>

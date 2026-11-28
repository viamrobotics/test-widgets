<script lang="ts">
	import { BoardClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'
	import { untrack } from 'svelte'

	import { useBoardState } from './board-state.svelte'
	import GpioRead from './GpioRead.svelte'
	import { missingPinReason, PIN_BUSY_REASON } from './pin-held-back-reason'
	import { toError } from './to-error'

	interface Props {
		partID: string
		resourceName: string
		pin: string
		setLastError: (error: Error | null) => void
	}

	const { pin, partID, resourceName, setLastError }: Props = $props()

	let gpioState = $state<boolean>()
	let pwmDutyCycle = $state<number>()
	let pwmFrequency = $state<number>()

	const client = createResourceClient(
		BoardClient,
		() => partID,
		() => resourceName
	)

	const trimmedPin = $derived(pin.trim())
	const { pinGuard } = untrack(() => useBoardState(partID, resourceName))
	const guard = $derived(pinGuard(trimmedPin))
	const pinReason = $derived(trimmedPin === '' ? missingPinReason(false) : undefined)
	const stateReason = $derived(pinReason ?? (guard.isBusy ? PIN_BUSY_REASON : undefined))

	// getGPIO changes the pin from write to read, and getPWM and getPWMFrequency read stored state.
	// All three stay mutations so the user decides when to call them.
	const getStateMutation = createResourceMutation(client, 'getGPIO')
	const getDutyCycleMutation = createResourceMutation(client, 'getPWM')
	const getFrequencyMutation = createResourceMutation(client, 'getPWMFrequency')

	// Resolves `false` for a press dropped while a write to the pin is in flight, so the button shows no check.
	const getState = async () => {
		const outcome = guard.run(async () => {
			try {
				gpioState = await getStateMutation.mutateAsync([trimmedPin])
				setLastError(null)
			} catch (error) {
				setLastError(toError(error))
				throw error
			}
		})
		if (outcome === undefined) return false
		return (await outcome) === 'succeeded'
	}
	const getDutyCycle = async () => {
		try {
			pwmDutyCycle = await getDutyCycleMutation.mutateAsync([trimmedPin])
			setLastError(null)
			return true
		} catch (error) {
			setLastError(toError(error))
			return false
		}
	}
	const getFrequency = async () => {
		try {
			pwmFrequency = await getFrequencyMutation.mutateAsync([trimmedPin])
			setLastError(null)
			return true
		} catch (error) {
			setLastError(toError(error))
			return false
		}
	}
</script>

<GpioRead
	{gpioState}
	{pwmDutyCycle}
	{pwmFrequency}
	{getState}
	{getDutyCycle}
	{getFrequency}
	blockedReason={pinReason}
	stateBlockedReason={stateReason}
/>

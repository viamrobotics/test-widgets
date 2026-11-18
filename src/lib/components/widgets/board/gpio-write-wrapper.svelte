<script lang="ts">
	import { BoardClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import GpioWrite from './gpio-write.svelte'
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

	const setState = async (high: boolean) => {
		try {
			await setStateMutation.mutateAsync([pin, high])
			setLastError(null)
			return true
		} catch (error) {
			setLastError(toError(error))
			return false
		}
	}
	const setDutyCycle = async (dutyCycleFraction: number) => {
		try {
			await setDutyCycleMutation.mutateAsync([pin, dutyCycleFraction])
			setLastError(null)
			return true
		} catch (error) {
			setLastError(toError(error))
			return false
		}
	}
	const setFrequency = async (frequencyHz: number) => {
		try {
			await setFrequencyMutation.mutateAsync([pin, frequencyHz])
			setLastError(null)
			return true
		} catch (error) {
			setLastError(toError(error))
			return false
		}
	}
</script>

<GpioWrite
	{setState}
	{setDutyCycle}
	{setFrequency}
/>

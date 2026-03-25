<script lang="ts">
	import { BoardClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import GpioWrite from './gpio-write.svelte'

	interface Props {
		partID: string
		resourceName: string
		pin: string
		setLastError: (err: Error | null) => void
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
		} catch (error) {
			setLastError(error as Error)
		}
	}
	const setDutyCycle = async (dutyCyclePct: number) => {
		try {
			await setDutyCycleMutation.mutateAsync([pin, dutyCyclePct])
			setLastError(null)
		} catch (error) {
			setLastError(error as Error)
		}
	}
	const setFrequency = async (frequencyHz: number) => {
		try {
			await setFrequencyMutation.mutateAsync([pin, frequencyHz])
			setLastError(null)
		} catch (error) {
			setLastError(error as Error)
		}
	}
</script>

<GpioWrite
	{setState}
	{setDutyCycle}
	{setFrequency}
/>

<script lang="ts">
	import { BoardClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import GpioRead from './gpio-read.svelte'

	interface Props {
		partID: string
		resourceName: string
		pin: string
		setLastError: (err: Error | null) => void
	}

	const { pin, partID, resourceName, setLastError }: Props = $props()

	let gpioState = $state<boolean>()
	let pwmDutyCycle = $state<number>()
	let pwmFreq = $state<number>()

	const client = createResourceClient(
		BoardClient,
		() => partID,
		() => resourceName
	)

	// Even though these seem like getters, they are actually mutations because they change pin states from write to read.
	// So we have to let the user decide when to call them.
	const getStateMutation = createResourceMutation(client, 'getGPIO')
	const getDutyCycleMutation = createResourceMutation(client, 'getPWM')
	const getFrequencyMutation = createResourceMutation(client, 'getPWMFrequency')

	const getState = async () => {
		try {
			const data = await getStateMutation.mutateAsync([pin])
			gpioState = data
			setLastError(null)
		} catch (error) {
			setLastError(error as Error)
		}
	}
	const getDutyCycle = async () => {
		try {
			const data = await getDutyCycleMutation.mutateAsync([pin])
			pwmDutyCycle = data
			setLastError(null)
		} catch (error) {
			setLastError(error as Error)
		}
	}
	const getFrequency = async () => {
		try {
			const data = await getFrequencyMutation.mutateAsync([pin])
			pwmFreq = data
			setLastError(null)
		} catch (error) {
			setLastError(error as Error)
		}
	}
</script>

<GpioRead
	{gpioState}
	{pwmDutyCycle}
	{pwmFreq}
	{getState}
	{getDutyCycle}
	{getFrequency}
/>

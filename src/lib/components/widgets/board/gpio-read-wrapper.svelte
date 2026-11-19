<script lang="ts">
	import { BoardClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import GpioRead from './gpio-read.svelte'
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

	// Even though these seem like getters, they are actually mutations because they change pin states from write to read.
	// So we have to let the user decide when to call them.
	const getStateMutation = createResourceMutation(client, 'getGPIO')
	const getDutyCycleMutation = createResourceMutation(client, 'getPWM')
	const getFrequencyMutation = createResourceMutation(client, 'getPWMFrequency')

	const getState = async () => {
		try {
			gpioState = await getStateMutation.mutateAsync([pin])
			setLastError(null)
			return true
		} catch (error) {
			setLastError(toError(error))
			return false
		}
	}
	const getDutyCycle = async () => {
		try {
			pwmDutyCycle = await getDutyCycleMutation.mutateAsync([pin])
			setLastError(null)
			return true
		} catch (error) {
			setLastError(toError(error))
			return false
		}
	}
	const getFrequency = async () => {
		try {
			pwmFrequency = await getFrequencyMutation.mutateAsync([pin])
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
/>

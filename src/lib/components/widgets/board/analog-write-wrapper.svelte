<script lang="ts">
	import { BoardClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import AnalogWrite from './analog-write.svelte'
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

	const setValue = async (value: number) => {
		try {
			await setValueMutation.mutateAsync([pin, value])
			setLastError(null)
			return true
		} catch (error) {
			setLastError(toError(error))
			return false
		}
	}
</script>

<AnalogWrite {setValue} />

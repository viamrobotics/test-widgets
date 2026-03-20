<script lang="ts">
	import { BoardClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import AnalogWrite from './analog-write.svelte'

	interface Props {
		pin: string
		partID: string
		resourceName: string
		setLastError: (err: Error | null) => void
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
		} catch (error) {
			setLastError(error as Error)
		}
	}
</script>

<AnalogWrite {setValue} />

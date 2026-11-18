<script lang="ts">
	import { BoardClient } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import AnalogRead from './analog-read.svelte'
	import { toError } from './to-error'

	interface Props {
		partID: string
		resourceName: string
		pin: string
		setLastError: (error: Error | null) => void
	}

	const { pin, partID, resourceName, setLastError }: Props = $props()

	let value = $state<number>()

	const client = createResourceClient(
		BoardClient,
		() => partID,
		() => resourceName
	)

	// Even though this seems like a getter, we treat it as a mutation to give the user
	// more control over when this is called.
	const getValueMutation = createResourceMutation(client, 'readAnalogReader')

	const getValue = async () => {
		try {
			const data = await getValueMutation.mutateAsync([pin])
			value = data?.value
			setLastError(null)
			return true
		} catch (error) {
			setLastError(toError(error))
			return false
		}
	}
</script>

<AnalogRead
	{value}
	{getValue}
/>

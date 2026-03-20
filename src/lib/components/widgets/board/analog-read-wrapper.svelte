<script lang="ts">
	import { BoardClient } from '@viamrobotics/sdk';
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk';

	import AnalogRead from './analog-read.svelte';

	interface Props {
		partID: string;
		resourceName: string;
		pin: string;
		setLastError: (err: Error | null) => void;
	}

	const { pin, partID, resourceName, setLastError }: Props = $props();

	let value = $state<number>();

	const client = createResourceClient(
		BoardClient,
		() => partID,
		() => resourceName
	);

	// Even though this seems like a getter, we treat it as a mutation to give the user
	// more control over when this is called.
	const getValueMutation = createResourceMutation(client, 'readAnalogReader');

	const getValue = async () => {
		try {
			const data = await getValueMutation.mutateAsync([pin]);
			value = data?.value;
			setLastError(null);
		} catch (error) {
			setLastError(error as Error);
		}
	};
</script>

<AnalogRead
	{value}
	{getValue}
/>

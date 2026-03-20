<script lang="ts">
	import { GantryClient } from '@viamrobotics/sdk';
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk';

	import { Button } from '@viamrobotics/prime-core';

	import ErrorDisplay from '$lib/components/error-display.svelte';

	interface Props {
		partID: string;
		resourceName: string;
	}

	const { partID, resourceName }: Props = $props();

	const client = createResourceClient(
		GantryClient,
		() => partID,
		() => resourceName
	);

	const homeMutation = createResourceMutation(client, 'home');
</script>

<Button
	class="w-fit"
	icon="play-circle-outline"
	onclick={() => {
		homeMutation.mutate([], {});
	}}
>
	Execute
</Button>
<ErrorDisplay lastError={homeMutation.error} />

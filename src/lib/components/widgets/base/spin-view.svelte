<script lang="ts">
	import { BaseClient } from '@viamrobotics/sdk';
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk';

	import MutationView from '$lib/components/mutation-view.svelte';
	import Spin from './spin.svelte';

	interface Props {
		partID: string;
		resourceName: string;
	}

	const { partID, resourceName }: Props = $props();

	const client = createResourceClient(
		BaseClient,
		() => partID,
		() => resourceName
	);

	const spinMutation = createResourceMutation(client, 'spin');
</script>

<MutationView lastError={spinMutation.error}>
	<Spin
		spin={(angleDeg: number, degsPerSec: number) => {
			spinMutation.mutate([angleDeg, degsPerSec], {});
		}}
	/>
</MutationView>

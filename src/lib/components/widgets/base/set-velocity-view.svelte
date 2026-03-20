<script lang="ts">
	import { BaseClient, type Vector3 } from '@viamrobotics/sdk';
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk';

	import MutationView from '$lib/components/mutation-view.svelte';
	import SetVelocity from './set-velocity.svelte';

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

	const setVelocityMutation = createResourceMutation(client, 'setVelocity');
</script>

<MutationView lastError={setVelocityMutation.error}>
	<SetVelocity
		setVelocity={(linear: Vector3, angular: Vector3) => {
			setVelocityMutation.mutate([linear, angular], {});
		}}
	/>
</MutationView>

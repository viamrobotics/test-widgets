<script lang="ts">
	import { MotorClient } from '@viamrobotics/sdk';
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk';

	import MutationView from '../mutation-view.svelte';
	import SetRPM from './set-rpm.svelte';

	interface Props {
		partID: string;
		resourceName: string;
	}

	const { partID, resourceName }: Props = $props();

	const client = createResourceClient(
		MotorClient,
		() => partID,
		() => resourceName
	);

	const setRPMMutation = createResourceMutation(client, 'setRPM');

	const setRPM = (val: number) => setRPMMutation.mutate([val], {});
</script>

<MutationView lastError={setRPMMutation.error}>
	<SetRPM {setRPM} />
</MutationView>

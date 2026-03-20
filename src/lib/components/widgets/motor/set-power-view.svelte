<script lang="ts">
	import { MotorClient } from '@viamrobotics/sdk';
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk';

	import MutationView from '$lib/components/mutation-view.svelte';
	import SetPower from './set-power.svelte';

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

	const setPowerMutation = createResourceMutation(client, 'setPower');

	const setPower = (val: number) => setPowerMutation.mutate([val], {});
</script>

<MutationView lastError={setPowerMutation.error}>
	<SetPower {setPower} />
</MutationView>

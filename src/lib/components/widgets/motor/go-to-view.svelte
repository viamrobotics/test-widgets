<script lang="ts">
	import { MotorClient } from '@viamrobotics/sdk';
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk';

	import MutationView from '$lib/components/mutation-view.svelte';
	import GoTo from './go-to.svelte';

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

	const goToMutation = createResourceMutation(client, 'goTo');

	const goTo = (rpm: number, pos: number) => {
		goToMutation.mutate([rpm, pos], {});
	};
</script>

<MutationView lastError={goToMutation.error}>
	<GoTo {goTo} />
</MutationView>

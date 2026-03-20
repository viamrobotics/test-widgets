<script lang="ts">
	import { Label, Switch } from '@viamrobotics/prime-core';
	import { BaseClient, type Vector3 } from '@viamrobotics/sdk';
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk';

	import MutationView from '$lib/components/mutation-view.svelte';
	import QuickMove from './quick-move.svelte';

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

	const quickSetPowerMutation = createResourceMutation(client, 'setPower');

	const quickSetPower = (linear: Vector3, angular: Vector3) => {
		quickSetPowerMutation.mutate([linear, angular], {});
	};

	let isKeyboardEnabled = $state(false);
</script>

<MutationView lastError={quickSetPowerMutation.error}>
	{#snippet titleInput()}
		<Label cx="w-fit!">
			Keyboard control

			<Switch
				slot="input"
				on={isKeyboardEnabled}
				on:change={() => (isKeyboardEnabled = !isKeyboardEnabled)}
			/>
		</Label>
	{/snippet}

	<QuickMove
		setPower={quickSetPower}
		{isKeyboardEnabled}
	/>
</MutationView>

<script lang="ts">
	import { Label, Switch } from '@viamrobotics/prime-core'
	import { BaseClient, type Vector3 } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import ConnectionStatus from '$lib/components/connection-status.svelte'

	import IsMovingWidget from './is-moving-widget.svelte'
	import MoveStraightWidget from './move-straight-widget.svelte'
	import QuickMove from './quick-move.svelte'
	import SetPowerWidget from './set-power-widget.svelte'
	import SetVelocityWidget from './set-velocity-widget.svelte'
	import SpinWidget from './spin-widget.svelte'
	import StopWidget from './stop-widget.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		BaseClient,
		() => partID,
		() => resourceName
	)

	const quickSetPowerMutation = createResourceMutation(client, 'setPower')

	const quickSetPower = (linear: Vector3, angular: Vector3) => {
		quickSetPowerMutation.mutate([linear, angular], {})
	}

	let quickMoveKeyboardControl = $state(false)
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="@container">
			<div class="flex flex-col divide-y @4xl:flex-row @4xl:divide-x @4xl:divide-y-0">
				<ApiSection
					class="flex-row flex-wrap gap-2"
					lastError={quickSetPowerMutation.error}
				>
					{#snippet heading()}Quick move{/snippet}
					{#snippet input()}
						<Label>
							Keyboard control

							<Switch
								slot="input"
								on={quickMoveKeyboardControl}
								on:change={() => (quickMoveKeyboardControl = !quickMoveKeyboardControl)}
							/>
						</Label>
					{/snippet}

					<div class="flex grow flex-wrap justify-between gap-2">
						<QuickMove
							isKeyboardEnabled={quickMoveKeyboardControl}
							setPower={quickSetPower}
						/>
					</div>
				</ApiSection>
				<div class="flex grow flex-col divide-y @4xl:ml-auto @4xl:w-full @4xl:max-w-40">
					<StopWidget
						{partID}
						{resourceName}
					/>
					<IsMovingWidget
						{partID}
						{resourceName}
					/>
				</div>
			</div>
		</div>
		<MoveStraightWidget
			{partID}
			{resourceName}
		/>
		<SpinWidget
			{partID}
			{resourceName}
		/>
		<SetPowerWidget
			{partID}
			{resourceName}
		/>
		<SetVelocityWidget
			{partID}
			{resourceName}
		/>
	{/snippet}
</ConnectionStatus>

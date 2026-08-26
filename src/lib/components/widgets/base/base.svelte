<script lang="ts">
	import { Label, Switch } from '@viamrobotics/prime-core'
	import { BaseClient, type Vector3 } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import IsMoving from '$lib/components/is-moving.svelte'
	import MutationSection from '$lib/components/mutation-section.svelte'
	import StopButton from '$lib/components/stop-button.svelte'

	import MoveStraight from './move-straight.svelte'
	import QuickMove from './quick-move.svelte'
	import SetPower from './set-power.svelte'
	import SetVelocity from './set-velocity.svelte'
	import Spin from './spin.svelte'

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

	const setPowerMutation = createResourceMutation(client, 'setPower')
	const quickSetPowerMutation = createResourceMutation(client, 'setPower')
	const setVelocityMutation = createResourceMutation(client, 'setVelocity')
	const spinMutation = createResourceMutation(client, 'spin')
	const moveStraightMutation = createResourceMutation(client, 'moveStraight')
	const stopMutation = createResourceMutation(client, 'stop')

	const setPower = (linear: Vector3, angular: Vector3) => {
		setPowerMutation.mutate([linear, angular], {})
	}

	const quickSetPower = (linear: Vector3, angular: Vector3) => {
		quickSetPowerMutation.mutate([linear, angular], {})
	}

	const setVelocity = (linear: Vector3, angular: Vector3) => {
		setVelocityMutation.mutate([linear, angular], {})
	}

	const spin = (angleDeg: number, degsPerSec: number) => {
		spinMutation.mutate([angleDeg, degsPerSec], {})
	}

	const moveStraight = (distanceMm: number, mmPerSec: number) => {
		moveStraightMutation.mutate([distanceMm, mmPerSec], {})
	}

	let quickMoveKeyboardControl = $state(false)
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="@container">
			<div class="flex flex-col divide-y @4xl:flex-row @4xl:divide-x @4xl:divide-y-0">
				<MutationSection
					title="Quick move"
					lastError={quickSetPowerMutation.error}
				>
					{#snippet titleInput()}
						<Label>
							Keyboard control

							<Switch
								slot="input"
								on={quickMoveKeyboardControl}
								on:change={() => (quickMoveKeyboardControl = !quickMoveKeyboardControl)}
							/>
						</Label>
					{/snippet}

					<QuickMove
						isKeyboardEnabled={quickMoveKeyboardControl}
						setPower={quickSetPower}
					/>
				</MutationSection>
				<div class="flex grow flex-col divide-y @4xl:ml-auto @4xl:w-full @4xl:max-w-40">
					<ApiSection
						title="Stop"
						api="rdk:component:base"
					>
						<StopButton
							error={stopMutation.error}
							onStop={() => {
								stopMutation.mutate([])
							}}
						/>
					</ApiSection>
					<IsMoving
						client={BaseClient}
						api="rdk:component:base"
						{partID}
						{resourceName}
					/>
				</div>
			</div>
		</div>
		<MutationSection
			title="MoveStraight"
			api="rdk:component:base"
			description="Move across a given distance at a given velocity"
			lastError={moveStraightMutation.error}
		>
			<MoveStraight {moveStraight} />
		</MutationSection>
		<MutationSection
			title="Spin"
			api="rdk:component:base"
			description="Turn to a given angle at a given velocity"
			lastError={spinMutation.error}
		>
			<Spin {spin} />
		</MutationSection>
		<MutationSection
			title="SetPower"
			api="rdk:component:base"
			description="Move continuously at a given amount of power"
			lastError={setPowerMutation.error}
		>
			<SetPower {setPower} />
		</MutationSection>
		<MutationSection
			title="SetVelocity"
			api="rdk:component:base"
			description="Move continually at a given velocity"
			lastError={setVelocityMutation.error}
		>
			<SetVelocity {setVelocity} />
		</MutationSection>
	{/snippet}
</ConnectionStatus>

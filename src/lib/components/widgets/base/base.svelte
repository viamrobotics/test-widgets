<script lang="ts">
	import { Label, Switch } from '@viamrobotics/prime-core'
	import { BaseClient, type Vector3 } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import { apiDocsHref } from '$lib/api-docs-href'
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
		<div class="flex flex-row divide-x">
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
			<div class="ml-auto flex w-full max-w-40 grow flex-col divide-y">
				<ApiSection
					title="Stop"
					method="stop"
					href={apiDocsHref('rdk:component:base', 'stop')}
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
		<MutationSection
			title="MoveStraight"
			method="moveStraight"
			href={apiDocsHref('rdk:component:base', 'moveStraight')}
			description="Move across a given distance at a given velocity"
			lastError={moveStraightMutation.error}
		>
			<MoveStraight {moveStraight} />
		</MutationSection>
		<MutationSection
			title="Spin"
			method="spin"
			href={apiDocsHref('rdk:component:base', 'spin')}
			description="Turn to a given angle at a given velocity"
			lastError={spinMutation.error}
		>
			<Spin {spin} />
		</MutationSection>
		<MutationSection
			title="SetPower"
			method="setPower"
			href={apiDocsHref('rdk:component:base', 'setPower')}
			description="Move continuously at a given amount of power"
			lastError={setPowerMutation.error}
		>
			<SetPower {setPower} />
		</MutationSection>
		<MutationSection
			title="SetVelocity"
			method="setVelocity"
			href={apiDocsHref('rdk:component:base', 'setVelocity')}
			description="Move continually at a given velocity"
			lastError={setVelocityMutation.error}
		>
			<SetVelocity {setVelocity} />
		</MutationSection>
	{/snippet}
</ConnectionStatus>

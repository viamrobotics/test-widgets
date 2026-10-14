<script lang="ts">
	import { Label, Switch } from '@viamrobotics/prime-core'
	import { BaseClient, type Vector3 } from '@viamrobotics/sdk'
	import { createResourceClient, createResourceMutation } from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import IsMoving from '$lib/components/is-moving.svelte'
	import { Section } from '$lib/components/section'
	import { useSectionErrors } from '$lib/components/section/use-section-errors.svelte'
	import StopButton from '$lib/components/stop-button.svelte'
	import { ResourceTriplets } from '$lib/resource-triplet'

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

	const quickMoveErrors = useSectionErrors(() => ({ mutations: [quickSetPowerMutation] }))

	let quickMoveKeyboardControl = $state(false)
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="@container">
			<div class="flex flex-col divide-y @4xl:flex-row @4xl:divide-x @4xl:divide-y-0">
				<Section class="flex-row flex-wrap gap-2">
					<div class="flex flex-col gap-0.5">
						<Section.Heading>Quick move</Section.Heading>
						<Label>
							Keyboard control

							<Switch
								slot="input"
								on={quickMoveKeyboardControl}
								on:change={() => (quickMoveKeyboardControl = !quickMoveKeyboardControl)}
							/>
						</Label>
					</div>

					<Section.Body>
						<div class="flex grow flex-wrap justify-between gap-2">
							<QuickMove
								isKeyboardEnabled={quickMoveKeyboardControl}
								setPower={quickSetPower}
							/>
						</div>
					</Section.Body>
					<Section.Errors errors={quickMoveErrors.errors} />
				</Section>
				<div class="flex grow flex-col divide-y @4xl:ml-auto @4xl:w-full @4xl:max-w-40">
					<ApiSection
						class="grow flex-col gap-4"
						method="Stop"
						api={ResourceTriplets.Base}
						mutations={[stopMutation]}
					>
						<StopButton
							onStop={() => {
								stopMutation.mutate([])
							}}
						/>
					</ApiSection>
					<IsMoving
						client={BaseClient}
						api={ResourceTriplets.Base}
						{partID}
						{resourceName}
					/>
				</div>
			</div>
		</div>
		<ApiSection
			class="flex-row flex-wrap gap-2"
			method="MoveStraight"
			api={ResourceTriplets.Base}
			mutations={[moveStraightMutation]}
		>
			{#snippet subheading()}
				<Section.Text>Move across a given distance at a given velocity</Section.Text>
			{/snippet}
			<div class="flex grow flex-wrap justify-between gap-2">
				<MoveStraight {moveStraight} />
			</div>
		</ApiSection>
		<ApiSection
			class="flex-row flex-wrap gap-2"
			method="Spin"
			api={ResourceTriplets.Base}
			mutations={[spinMutation]}
		>
			{#snippet subheading()}
				<Section.Text>Turn to a given angle at a given velocity</Section.Text>
			{/snippet}
			<div class="flex grow flex-wrap justify-between gap-2">
				<Spin {spin} />
			</div>
		</ApiSection>
		<ApiSection
			class="flex-row flex-wrap gap-2"
			method="SetPower"
			api={ResourceTriplets.Base}
			mutations={[setPowerMutation]}
		>
			{#snippet subheading()}
				<Section.Text>Move continuously at a given amount of power</Section.Text>
			{/snippet}
			<div class="flex grow flex-wrap justify-between gap-2">
				<SetPower {setPower} />
			</div>
		</ApiSection>
		<ApiSection
			class="flex-row flex-wrap gap-2"
			method="SetVelocity"
			api={ResourceTriplets.Base}
			mutations={[setVelocityMutation]}
		>
			{#snippet subheading()}
				<Section.Text>Move continually at a given velocity</Section.Text>
			{/snippet}
			<div class="flex grow flex-wrap justify-between gap-2">
				<SetVelocity {setVelocity} />
			</div>
		</ApiSection>
	{/snippet}
</ConnectionStatus>

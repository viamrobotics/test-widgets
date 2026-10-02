<script lang="ts">
	import { MotorClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import IsMoving from '$lib/components/is-moving.svelte'
	import Query from '$lib/components/query.svelte'
	import { Section } from '$lib/components/section'
	import { useSectionErrors } from '$lib/components/section/use-section-errors.svelte'
	import StopButton from '$lib/components/stop-button.svelte'
	import { formatNumeric } from '$lib/format'
	import { ResourceTriplets } from '$lib/resource-triplet'

	import GoFor from './go-for.svelte'
	import GoTo from './go-to.svelte'
	import QuickMove from './quick-move.svelte'
	import SetPower from './set-power.svelte'
	import SetRPM from './set-rpm.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()

	const client = createResourceClient(
		MotorClient,
		() => partID,
		() => resourceName
	)

	const propertiesQuery = createResourceQuery(client, 'getProperties', {
		refetchInterval: false,
	})

	const isPoweredQuery = createResourceQuery(client, 'isPowered', {
		refetchInterval: 500,
	})

	const positionQuery = createResourceQuery(client, 'getPosition', () => ({
		enabled: propertiesQuery.data?.positionReporting === true,
		refetchInterval: 500,
	}))

	const setPowerMutation = createResourceMutation(client, 'setPower')
	const quickSetPowerMutation = createResourceMutation(client, 'setPower')
	const setRPMMutation = createResourceMutation(client, 'setRPM')
	const goForMutation = createResourceMutation(client, 'goFor')
	const goToMutation = createResourceMutation(client, 'goTo')
	const stopMutation = createResourceMutation(client, 'stop')

	const quickMoveErrors = useSectionErrors(() => ({ mutations: [quickSetPowerMutation] }))

	const setPower = (val: number) => {
		setPowerMutation.mutate([val], {})
	}

	const quickSetPower = (val: number) => {
		quickSetPowerMutation.mutate([val], {})
	}

	const setRPM = (val: number) => {
		setRPMMutation.mutate([val], {})
	}

	const goFor = (rpm: number, revolutions: number) => {
		goForMutation.mutate([rpm, revolutions], {})
	}

	const goTo = (rpm: number, pos: number) => {
		goToMutation.mutate([rpm, pos], {})
	}
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="@container">
			<div class="flex flex-col divide-y @2xl:flex-row @2xl:divide-x @2xl:divide-y-0">
				<div class="flex w-full flex-col divide-y">
					<Section class="flex-row flex-wrap gap-2">
						<div class="flex flex-col gap-0.5">
							<Section.Heading>Quick move</Section.Heading>
						</div>
						<Section.Body>
							<div class="flex grow flex-wrap justify-between gap-2">
								<QuickMove setPower={quickSetPower} />
							</div>
						</Section.Body>
						<Section.Errors errors={quickMoveErrors.errors} />
					</Section>
					<ApiSection
						class="flex-row flex-wrap gap-2"
						method="SetPower"
						api={ResourceTriplets.Motor}
						mutations={[setPowerMutation]}
					>
						{#snippet subheading()}<Section.Text>Move continuously</Section.Text>{/snippet}
						<div class="flex grow flex-wrap justify-between gap-2">
							<SetPower {setPower} />
						</div>
					</ApiSection>
					{#if propertiesQuery.data?.positionReporting}
						<ApiSection
							class="flex-row flex-wrap gap-2"
							method="SetRPM"
							api={ResourceTriplets.Motor}
							mutations={[setRPMMutation]}
						>
							{#snippet subheading()}<Section.Text
									>Move indefinitely at a specified speed.</Section.Text
								>{/snippet}
							<div class="flex grow flex-wrap justify-between gap-2">
								<SetRPM {setRPM} />
							</div>
						</ApiSection>
						<ApiSection
							class="flex-row flex-wrap gap-2"
							method="GoFor"
							api={ResourceTriplets.Motor}
							mutations={[goForMutation]}
						>
							{#snippet subheading()}<Section.Text
									>Move a specified number of revolutions</Section.Text
								>{/snippet}
							<div class="flex grow flex-wrap justify-between gap-2">
								<GoFor {goFor} />
							</div>
						</ApiSection>
						<ApiSection
							class="flex-row flex-wrap gap-2"
							method="GoTo"
							api={ResourceTriplets.Motor}
							mutations={[goToMutation]}
						>
							{#snippet subheading()}<Section.Text>Turn to a specified position</Section.Text
								>{/snippet}
							<div class="flex grow flex-wrap justify-between gap-2">
								<GoTo {goTo} />
							</div>
						</ApiSection>
					{/if}
				</div>

				<div class="flex w-full flex-col divide-y @2xl:ml-auto @2xl:max-w-1/2 @4xl:max-w-1/3">
					<ApiSection
						class="grow flex-col gap-4"
						method="Stop"
						api={ResourceTriplets.Motor}
						mutations={[stopMutation]}
					>
						<StopButton
							onStop={() => {
								stopMutation.mutate([])
							}}
						/>
					</ApiSection>
					<IsMoving
						client={MotorClient}
						api={ResourceTriplets.Motor}
						{partID}
						{resourceName}
					>
						<div class="flex flex-col gap-6 pt-2">
							<ApiSection
								method="IsPowered"
								api={ResourceTriplets.Motor}
								class="grow flex-col gap-3 p-0!"
							>
								{#snippet tooltip()}
									Returns whether or not the motor is running and the current portion of max power.
									Stepper motors will report ”true” if they are being powered while holding a
									position and while they are turning.
								{/snippet}
								<Query query={isPoweredQuery}>
									{#if isPoweredQuery.data !== undefined}
										{@const [isPowered, powerPct] = isPoweredQuery.data}
										<span class="font-roboto-mono flex flex-row gap-1 text-xs">
											<p class="text-default">{isPowered}</p>
											<p class="text-disabled">/</p>
											<p class="text-subtle-1">
												{formatNumeric(powerPct * 100, 1)}%
											</p>
										</span>
									{/if}
								</Query>
							</ApiSection>
							{#if propertiesQuery.data?.positionReporting === true}
								<ApiSection
									method="GetPosition"
									api={ResourceTriplets.Motor}
									class="grow flex-col gap-3 p-0!"
								>
									{#snippet tooltip()}
										Reports the position of an encoded motor in revolutions from zero/home.
									{/snippet}
									<Query query={positionQuery}>
										<p class="font-roboto-mono text-default text-xs">
											{formatNumeric(positionQuery.data, 4)}
										</p>
									</Query>
								</ApiSection>
							{/if}
						</div>
					</IsMoving>
				</div>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>

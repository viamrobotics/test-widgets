<script lang="ts">
	import { StatusDot } from '@viamrobotics/prime-ui'
	import { MotorClient } from '@viamrobotics/sdk'
	import {
		createResourceClient,
		createResourceMutation,
		createResourceQuery,
	} from '@viamrobotics/svelte-sdk'

	import ApiSection from '$lib/components/api-section.svelte'
	import ConnectionStatus from '$lib/components/connection-status.svelte'
	import IsMoving from '$lib/components/is-moving.svelte'
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
					<Section
						errorReporter={quickMoveErrors}
						class="flex-row flex-wrap gap-2"
					>
						<div class="flex flex-col gap-0.5">
							<Section.Heading>
								Quick move
								{#snippet aside()}
									<Section.Errors errors={quickMoveErrors.errors} />
								{/snippet}
							</Section.Heading>
						</div>
						<Section.Body>
							<div class="flex grow flex-wrap justify-between gap-2">
								<QuickMove setPower={quickSetPower} />
							</div>
						</Section.Body>
					</Section>
					<ApiSection
						class="flex-row flex-wrap gap-2"
						method="SetPower"
						api={ResourceTriplets.Motor}
						mutations={[setPowerMutation]}
					>
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
						isCompact
					>
						<div class="flex flex-col gap-4 pt-2">
							<ApiSection
								method="IsPowered"
								api={ResourceTriplets.Motor}
								queries={[isPoweredQuery]}
								class="grow flex-col gap-1 p-0!"
							>
								{#snippet tooltip()}
									Returns whether or not the motor is running and the current portion of max power.
									Stepper motors will report “true” if they are being powered while holding a
									position and while they are turning.
								{/snippet}
								{#if isPoweredQuery.data !== undefined}
									{@const [isPowered, powerPct] = isPoweredQuery.data}
									<div class="flex items-center gap-2">
										<span class="text-subtle-1 text-xs">Power</span>
										<StatusDot
											state={isPowered ? 'success' : 'danger'}
											label={isPowered ? 'Powered' : 'Not powered'}
										/>
										<span class="readout font-roboto-mono">
											{isPowered ? `${formatNumeric(powerPct * 100, 1)}%` : '-'}
										</span>
									</div>
								{/if}
							</ApiSection>
							{#if propertiesQuery.data?.positionReporting === true}
								<ApiSection
									method="GetPosition"
									api={ResourceTriplets.Motor}
									queries={[positionQuery]}
									class="grow flex-col gap-1 p-0!"
								>
									{#snippet tooltip()}
										Reports the position of an encoded motor in revolutions from zero/home.
									{/snippet}
									{#if positionQuery.data !== undefined}
										<span class="readout font-roboto-mono">
											{formatNumeric(positionQuery.data, 4)}
										</span>
									{/if}
								</ApiSection>
							{/if}
						</div>
					</IsMoving>
				</div>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>

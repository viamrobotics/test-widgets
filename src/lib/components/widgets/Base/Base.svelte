<script lang="ts">
	import ConnectionStatus from '#lib/components/ConnectionStatus.svelte'

	import IsMovingWidget from './IsMovingWidget.svelte'
	import MoveStraightWidget from './MoveStraightWidget.svelte'
	import QuickMoveWidget from './QuickMoveWidget.svelte'
	import SetPowerWidget from './SetPowerWidget.svelte'
	import SetVelocityWidget from './SetVelocityWidget.svelte'
	import SpinWidget from './SpinWidget.svelte'
	import StopWidget from './StopWidget.svelte'

	interface Props {
		partID: string
		resourceName: string
	}

	const { partID, resourceName }: Props = $props()
</script>

<ConnectionStatus {partID}>
	{#snippet connected()}
		<div class="@container">
			<div class="flex flex-col divide-y @4xl:flex-row @4xl:divide-x @4xl:divide-y-0">
				<QuickMoveWidget
					{partID}
					{resourceName}
				/>
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

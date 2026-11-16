<script lang="ts">
	import ConnectionStatus from '$lib/components/connection-status.svelte'

	import IsMovingWidget from './is-moving-widget.svelte'
	import MoveStraightWidget from './move-straight-widget.svelte'
	import QuickMoveWidget from './quick-move-widget.svelte'
	import SetPowerWidget from './set-power-widget.svelte'
	import SetVelocityWidget from './set-velocity-widget.svelte'
	import SpinWidget from './spin-widget.svelte'
	import StopWidget from './stop-widget.svelte'

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

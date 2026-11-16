<script lang="ts">
	import ConnectionStatus from '$lib/components/connection-status.svelte'

	import IsHoldingSomethingWidget from './is-holding-something-widget.svelte'
	import IsMovingWidget from './is-moving-widget.svelte'
	import OpenGrabControl from './open-grab-control.svelte'
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
			<div class="flex flex-col divide-y @lg:flex-row @lg:divide-x @lg:divide-y-0">
				<OpenGrabControl
					class="grow"
					{partID}
					{resourceName}
				/>
				<div class="flex flex-col divide-y">
					<StopWidget
						{partID}
						{resourceName}
					/>
					<IsMovingWidget
						{partID}
						{resourceName}
					/>
					<IsHoldingSomethingWidget
						{partID}
						{resourceName}
					/>
				</div>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>

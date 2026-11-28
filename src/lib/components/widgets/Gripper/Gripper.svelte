<script lang="ts">
	import ConnectionStatus from '#lib/components/ConnectionStatus.svelte'

	import IsHoldingSomethingWidget from './IsHoldingSomethingWidget.svelte'
	import IsMovingWidget from './IsMovingWidget.svelte'
	import OpenGrabControl from './OpenGrabControl.svelte'
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

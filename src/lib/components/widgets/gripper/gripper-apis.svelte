<script lang="ts">
	import ConnectionStatus from '$lib/components/connection-status.svelte'

	import GrabWidget from './grab-widget.svelte'
	import IsHoldingSomething from './is-holding-something-widget.svelte'
	import IsMovingWidget from './is-moving-widget.svelte'
	import OpenWidget from './open-widget.svelte'
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
				<span class="flex grow flex-wrap gap-4">
					<OpenWidget
						{partID}
						{resourceName}
						class="grow-0 gap-3 @xs:pr-0"
					/>
					<GrabWidget
						{partID}
						{resourceName}
						class="grow-0 gap-3 @xs:pl-0"
					/>
				</span>
				<div class="flex flex-col divide-y">
					<StopWidget
						{partID}
						{resourceName}
					/>
					<IsMovingWidget
						{partID}
						{resourceName}
					/>
					<IsHoldingSomething
						{partID}
						{resourceName}
					/>
				</div>
			</div>
		</div>
	{/snippet}
</ConnectionStatus>

<script lang="ts">
	import ConnectionStatus from '#lib/components/ConnectionStatus.svelte'

	import GetPositionWidget from './GetPositionWidget.svelte'
	import IsMovingWidget from './IsMovingWidget.svelte'
	import MoveWidget from './MoveWidget.svelte'
	import QuickMoveWidget from './QuickMoveWidget.svelte'
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
				<div class="@container grow">
					<div class="grid grid-cols-1 divide-y @2xl:grid-cols-3 @2xl:divide-x @2xl:divide-y-0">
						<GetPositionWidget
							{partID}
							{resourceName}
						/>
						<MoveWidget
							{partID}
							{resourceName}
						/>
						<QuickMoveWidget
							{partID}
							{resourceName}
						/>
					</div>
				</div>
				<div class="flex flex-col divide-y @4xl:ml-auto @4xl:w-full @4xl:max-w-40">
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
	{/snippet}
</ConnectionStatus>

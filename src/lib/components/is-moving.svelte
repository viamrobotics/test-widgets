<script lang="ts">
	import type * as SDK from '@viamrobotics/sdk'
	import type { HTMLAttributes } from 'svelte/elements'

	import { Tooltip } from '@viamrobotics/prime-ui'
	import { createResourceClient, createResourceQuery } from '@viamrobotics/svelte-sdk'

	import type { ResourceTriplet } from '$lib/resource-triplet'

	import ApiSection from './api-section.svelte'
	import { Section } from './section'
	import StatusPill from './status-pill.svelte'

	type Client =
		| typeof SDK.ArmClient
		| typeof SDK.BaseClient
		| typeof SDK.GantryClient
		| typeof SDK.GripperClient
		| typeof SDK.MotorClient
		| typeof SDK.ServoClient

	type Resource = SDK.Arm | SDK.Base | SDK.Gantry | SDK.Gripper | SDK.Motor | SDK.Servo

	interface Props extends HTMLAttributes<HTMLElement> {
		client: Client
		partID: string
		resourceName: string
		api: ResourceTriplet
		/** Render only the Moving or Idle badge, with the update hint in a tooltip. */
		isCompact?: boolean
	}

	const {
		client: clientClass,
		partID,
		resourceName,
		api,
		isCompact = false,
		children,
		class: className,
	}: Props = $props()

	const client = $derived(
		createResourceClient<Resource>(
			clientClass,
			() => partID,
			() => resourceName
		)
	)

	const query = $derived(createResourceQuery(client, 'isMoving', { refetchInterval: 500 }))
</script>

<ApiSection
	class={['grow flex-col gap-4', className]}
	method="IsMoving"
	queries={[query]}
	{api}
>
	{#if isCompact}
		{@const isMoving = query.data ?? false}
		<Tooltip>
			<Tooltip.Trigger>
				<!-- Keyboard focus is the only way to open the tooltip without a pointer. -->
				<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
				<span
					class={['badge', isMoving ? 'badge-success' : 'badge-neutral']}
					tabindex="0"
				>
					{isMoving ? 'Moving' : 'Idle'}
				</span>
			</Tooltip.Trigger>
			<Tooltip.Content>Updates automatically</Tooltip.Content>
		</Tooltip>
		{@render children?.()}
	{:else}
		<StatusPill isActive={query.data ?? false} />
		{@render children?.()}
		<Section.Text class="mt-auto">Updates automatically</Section.Text>
	{/if}
</ApiSection>

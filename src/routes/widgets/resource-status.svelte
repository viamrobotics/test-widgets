<script lang="ts">
	import { robotApi } from '@viamrobotics/sdk'

	import type { NamedResourceStatus } from '$lib/resource'

	interface Props {
		resource: NamedResourceStatus
	}

	const { resource }: Props = $props()

	const STATUS_MAP: Record<
		number,
		{ label: string; variant: 'badge-danger' | 'badge-warning' | 'badge-neutral' | 'badge-success' }
	> = {
		[robotApi.ResourceStatus_State.UNHEALTHY]: {
			label: 'Failed',
			variant: 'badge-danger',
		},
		[robotApi.ResourceStatus_State.UNCONFIGURED]: {
			label: 'Unconfigured',
			variant: 'badge-danger',
		},
		[robotApi.ResourceStatus_State.REMOVING]: {
			label: 'Removing...',
			variant: 'badge-warning',
		},
		[robotApi.ResourceStatus_State.CONFIGURING]: {
			label: 'Configuring...',
			variant: 'badge-neutral',
		},
		[robotApi.ResourceStatus_State.READY]: {
			label: 'Ready',
			variant: 'badge-success',
		},
	}

	const badgeProps = $derived(STATUS_MAP[resource.state])
</script>

{#if badgeProps}
	<span class={['badge', badgeProps.variant]}>{badgeProps.label}</span>
{/if}

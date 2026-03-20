<script lang="ts">
	import { Badge } from '@viamrobotics/prime-core';
	import { robotApi } from '@viamrobotics/sdk';

	import type { NamedResourceStatus } from './resource';

	interface Props {
		resource: NamedResourceStatus;
	}

	const { resource }: Props = $props();

	const STATUS_MAP: Record<
		number,
		{ label: string; variant: 'danger' | 'warning' | 'inactive' | 'success' }
	> = {
		[robotApi.ResourceStatus_State.UNHEALTHY]: {
			label: 'Failed',
			variant: 'danger'
		},
		[robotApi.ResourceStatus_State.UNCONFIGURED]: {
			label: 'Unconfigured',
			variant: 'danger'
		},
		[robotApi.ResourceStatus_State.REMOVING]: {
			label: 'Removing...',
			variant: 'warning'
		},
		[robotApi.ResourceStatus_State.CONFIGURING]: {
			label: 'Configuring...',
			variant: 'inactive'
		},
		[robotApi.ResourceStatus_State.READY]: {
			label: 'Ready',
			variant: 'success'
		}
	};

	const badgeProps = $derived(STATUS_MAP[resource.state]);
</script>

{#if badgeProps}
	<Badge
		label={badgeProps.label}
		variant={badgeProps.variant}
	/>
{/if}

<script lang="ts">
	import { Icon } from '@viamrobotics/prime-core';

	interface Props {
		type: string;
	}

	const { type }: Props = $props();

	const getIconName = (resourceType: string) => {
		if (resourceType === 'component') {
			return 'viam-component' as const;
		}

		return resourceType === 'service' ? ('viam-service' as const) : undefined;
	};

	const iconName = $derived(getIconName(type));
</script>

<!-- 'check' is just a placeholder when there's not an iconName -->
<Icon
	name={iconName ?? 'check'}
	cx={[
		'shrink-0',
		'text-gray-6',
		{
			'opacity-0': !iconName
		}
	]}
/>

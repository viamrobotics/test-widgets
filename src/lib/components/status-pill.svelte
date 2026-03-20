<script lang="ts">
	import { Pill } from '@viamrobotics/prime-core';

	interface Props {
		isActive: boolean;
		activeText?: string;
		inactiveText?: string;
	}

	const { isActive, activeText = 'Moving...', inactiveText = 'Idle' }: Props = $props();
</script>

{#if isActive}
	<Pill
		cx="h-[20px] rounded-full border border-[#B9DCBC] bg-[#E0FAE3]! px-2.5 text-[#3D7D3F]"
		removable={false}
		value={activeText}
	/>
{:else}
	<Pill
		cx="border-medium h-[20px] rounded-full border px-2.5"
		removable={false}
		value={inactiveText}
	/>
{/if}

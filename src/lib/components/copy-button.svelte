<script lang="ts">
	import { Icon } from '@viamrobotics/prime-core';

	interface Props {
		data: string;
		ariaLabel?: string;
	}

	const { data, ariaLabel = 'Copy to clipboard' }: Props = $props();

	let showCopySuccess = $state(false);

	const handleCopyClick = (event: Event) => {
		event.stopPropagation();
		event.preventDefault();
		copyToClipboard(data);
		showCopySuccess = true;
		setTimeout(() => {
			showCopySuccess = false;
		}, 750);
	};

	export const copyToClipboard = (copiedData: string) => {
		void window.navigator.clipboard.writeText(copiedData);
	};
</script>

<button
	onclick={handleCopyClick}
	aria-label={ariaLabel}
	class="text-gray-6 hover:border-medium hover:bg-medium active:bg-gray-2 justify-items-end p-0.5"
>
	<Icon
		name={showCopySuccess ? 'check' : 'content-copy'}
		size="xs"
	/>
</button>

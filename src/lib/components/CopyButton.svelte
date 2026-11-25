<script lang="ts">
	import { IconButton, Tooltip } from '@viamrobotics/prime-core'

	interface Props {
		data: string
		ariaLabel?: string
	}

	const { data, ariaLabel = 'Copy to clipboard' }: Props = $props()

	let showCopySuccess = $state(false)

	const handleCopyClick = (event: Event) => {
		event.stopPropagation()
		event.preventDefault()
		copyToClipboard(data)
		showCopySuccess = true
		setTimeout(() => {
			showCopySuccess = false
		}, 750)
	}

	export const copyToClipboard = (copiedData: string) => {
		void globalThis.navigator.clipboard.writeText(copiedData)
	}
</script>

<Tooltip>
	<IconButton
		onclick={handleCopyClick}
		aria-label={ariaLabel}
		class="text-gray-6 hover:border-medium hover:bg-medium active:bg-gray-2 justify-items-end p-0.5"
		icon={showCopySuccess ? 'check' : 'content-copy'}
		label="Copy to clipboard"
	/>
	<span slot="description">{ariaLabel}</span>
</Tooltip>

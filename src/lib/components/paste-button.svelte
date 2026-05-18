<script lang="ts">
	import { Icon, Tooltip } from '@viamrobotics/prime-core'

	interface Props {
		onPaste: (data: string) => boolean
		ariaLabel?: string
	}

	const { onPaste, ariaLabel = 'Paste from clipboard' }: Props = $props()

	let isPasteSuccessful = $state<boolean | null>(null)

	const handlePasteClick = async (event: Event) => {
		event.stopPropagation()
		event.preventDefault()
		const data = await globalThis.navigator.clipboard.readText()
		isPasteSuccessful = onPaste(data)
		setTimeout(() => {
			isPasteSuccessful = null
		}, 750)
	}

	const iconName = $derived(
		isPasteSuccessful === null ? 'content-paste' : isPasteSuccessful ? 'check' : 'close'
	)
</script>

<Tooltip>
	<button
		onclick={handlePasteClick}
		aria-label={ariaLabel}
		class="text-gray-6 hover:border-medium hover:bg-medium active:bg-gray-2 justify-items-end p-0.5"
	>
		<Icon
			name={iconName}
			size="xs"
		/>
	</button>
	<span slot="description">{ariaLabel}</span>
</Tooltip>

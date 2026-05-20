<script lang="ts">
	import { IconButton, Tooltip } from '@viamrobotics/prime-core'

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
		// eslint-disable-next-line unicorn/no-nested-ternary
		isPasteSuccessful === null ? 'content-paste' : isPasteSuccessful ? 'check' : 'close'
	)
</script>

<Tooltip>
	<IconButton
		onclick={handlePasteClick}
		aria-label={ariaLabel}
		class="text-gray-6 hover:border-medium hover:bg-medium active:bg-gray-2 justify-items-end p-0.5"
		icon={iconName}
		label="Paste from clipboard"
	/>
	<span slot="description">{ariaLabel}</span>
</Tooltip>

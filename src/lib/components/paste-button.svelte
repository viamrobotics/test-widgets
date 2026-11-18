<script lang="ts">
	import { mdiCheck, mdiClose, mdiContentPaste } from '@mdi/js'
	import { Icon, Tooltip } from '@viamrobotics/prime-ui'

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

	const icon = $derived(
		// eslint-disable-next-line unicorn/no-nested-ternary
		isPasteSuccessful === null ? mdiContentPaste : isPasteSuccessful ? mdiCheck : mdiClose
	)
</script>

<Tooltip>
	<Tooltip.Trigger>
		<button
			type="button"
			class="icon-button size-6"
			aria-label={ariaLabel}
			onclick={handlePasteClick}
		>
			<Icon
				{icon}
				size="sm"
			/>
		</button>
	</Tooltip.Trigger>
	<Tooltip.Content>{ariaLabel}</Tooltip.Content>
</Tooltip>

<script lang="ts">
	import { mdiCheck, mdiContentCopy } from '@mdi/js'
	import { Icon, Tooltip } from '@viamrobotics/prime-ui'

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
	<Tooltip.Trigger>
		<button
			type="button"
			class="icon-button size-6"
			aria-label={ariaLabel}
			onclick={handleCopyClick}
		>
			<Icon
				icon={showCopySuccess ? mdiCheck : mdiContentCopy}
				size="sm"
			/>
		</button>
	</Tooltip.Trigger>
	<Tooltip.Content>{ariaLabel}</Tooltip.Content>
</Tooltip>

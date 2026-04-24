<script lang="ts">
	import { IconButton, Tooltip } from '@viamrobotics/prime-core'
	import { twMerge } from 'tailwind-merge'

	interface Props {
		lastError: Error | null | undefined
		id?: string
		class?: string
	}

	const defaultId = $props.id()

	const { lastError, id = `error_${defaultId}`, class: className = '' }: Props = $props()

	const errorText = $derived(
		lastError?.name && lastError.message ? `${lastError.name}: ${lastError.message}` : ''
	)

	let showCopySuccess = $state(false)

	const copyErrorToClipboard = async () => {
		try {
			await globalThis.navigator.clipboard.writeText(errorText)
			showCopySuccess = true
			setTimeout(() => {
				showCopySuccess = false
			}, 750)
		} catch (error) {
			console.error('Failed to copy error to clipboard', error)
		}
	}
</script>

{#if errorText}
	<div class="flex items-start gap-1">
		<p
			{id}
			class={twMerge('font-roboto-mono text-danger-dark text-xs', className)}
		>
			{errorText}
		</p>
		<Tooltip let:tooltipID>
			<IconButton
				aria-describedby={tooltipID}
				icon={showCopySuccess ? 'check' : 'content-copy'}
				label="Copy error"
				on:click={copyErrorToClipboard}
			/>
			<div slot="description">Copy error</div>
		</Tooltip>
	</div>
{/if}

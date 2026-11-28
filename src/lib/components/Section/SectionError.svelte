<script lang="ts">
	import type { ClassValue } from 'svelte/elements'

	import { mdiCheck, mdiContentCopy } from '@mdi/js'
	import { Icon, Tooltip } from '@viamrobotics/prime-ui'
	import { untrack } from 'svelte'

	import { useSectionErrorReporter } from './section-error-reporter'

	interface Props {
		error: Error | null | undefined
		/** Id of the inline line rendered outside a section, for an `aria-describedby` that points at it. */
		id?: string
		/** Classes for the inline line rendered outside a section. */
		class?: ClassValue
	}

	const defaultId = $props.id()

	const { error, id = `error_${defaultId}`, class: className }: Props = $props()

	const getReporter = useSectionErrorReporter()
	const reporter = $derived(getReporter?.())

	$effect(() => {
		const current = reporter
		// Registering writes the section's error set, so it must not subscribe this effect to it.
		return untrack(() => current?.report(() => error ?? null))
	})

	const COPY_CONFIRMATION_MS = 750

	const errorText = $derived(error?.name && error.message ? `${error.name}: ${error.message}` : '')

	let isShowingCopySuccess = $state(false)
	let copySuccessTimeoutId: ReturnType<typeof setTimeout> | undefined

	const copyErrorToClipboard = async () => {
		try {
			await globalThis.navigator.clipboard.writeText(errorText)
			isShowingCopySuccess = true
			clearTimeout(copySuccessTimeoutId)
			copySuccessTimeoutId = setTimeout(() => {
				isShowingCopySuccess = false
			}, COPY_CONFIRMATION_MS)
		} catch (copyError) {
			console.error('Failed to copy error to clipboard', copyError)
		}
	}

	$effect(() => () => clearTimeout(copySuccessTimeoutId))
</script>

<!--
	Adds `error` to the enclosing section's indicator. Outside a section that shows errors, such as
	a form rendered on its own, it falls back to an inline error line with a copy button.
-->
{#if !reporter && errorText}
	<div class="flex items-center justify-between gap-1">
		<p
			{id}
			class={[
				'font-roboto-mono text-danger-dark min-w-0 overflow-auto text-xs wrap-break-word',
				className,
			]}
		>
			{errorText}
		</p>
		<div class="shrink-0">
			<Tooltip>
				<Tooltip.Trigger>
					<button
						type="button"
						class="icon-button"
						aria-label="Copy error"
						onclick={copyErrorToClipboard}
					>
						<Icon icon={isShowingCopySuccess ? mdiCheck : mdiContentCopy} />
					</button>
				</Tooltip.Trigger>
				<Tooltip.Content>Copy error</Tooltip.Content>
			</Tooltip>
		</div>
	</div>
{/if}

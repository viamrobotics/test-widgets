<script lang="ts">
	import type { ClassValue } from 'svelte/elements'

	import { untrack } from 'svelte'

	import ErrorDisplay from '../error.svelte'
	import { useSectionErrorReporter } from './section-error-reporter'

	interface Props {
		error: Error | null | undefined
		/** Classes for the inline line rendered outside a section. */
		class?: ClassValue
	}

	const { error, class: className }: Props = $props()

	const getReporter = useSectionErrorReporter()
	const reporter = $derived(getReporter?.())

	$effect(() => {
		const current = reporter
		// Registering writes the section's error set, so it must not subscribe this effect to it.
		return untrack(() => current?.report(() => error ?? null))
	})
</script>

<!--
	Adds `error` to the enclosing section's indicator. Outside a section that shows errors, such as
	a form rendered on its own, it falls back to an inline error line.
-->
{#if !reporter}
	<ErrorDisplay
		lastError={error}
		class={className}
	/>
{/if}

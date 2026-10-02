<script lang="ts">
	import ErrorDisplay from '../error.svelte'
	import { errorKey } from './error-key'

	interface Props {
		errors: Error[]
	}

	const { errors }: Props = $props()
</script>

<!-- A section's errors below its content, one line each. -->
{#if errors.length > 0}
	<div class="flex w-full flex-col gap-1">
		{#each errors as error (errorKey(error))}
			<ErrorDisplay lastError={error} />
		{/each}
	</div>
{/if}

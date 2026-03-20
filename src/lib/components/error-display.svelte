<script lang="ts">
	import { twMerge } from 'tailwind-merge';

	interface Props {
		lastError: Error | null | undefined;
		id?: string;
		class?: string;
	}

	const defaultId = $props.id();

	const { lastError, id = `error_${defaultId}`, class: className = '' }: Props = $props();

	const errorName = $derived(lastError?.name);
	const errorMessage = $derived(lastError?.message);
</script>

{#if errorName && errorMessage}
	<p
		{id}
		class={twMerge('font-roboto-mono text-danger-dark text-xs', className)}
	>
		{`${errorName}: ${errorMessage}`}
	</p>
{/if}

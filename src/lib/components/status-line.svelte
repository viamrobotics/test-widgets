<script lang="ts">
	interface Props {
		/** The step in flight. An empty string is the empty state. */
		text: string
	}

	const { text }: Props = $props()
</script>

<!-- No role: many widget specs query getByRole('status'), and a second status role would break them. -->
<p
	aria-live="polite"
	data-testid="status-line"
	class="text-subtle-2 h-4 truncate text-xs leading-4"
>
	{text}
</p>

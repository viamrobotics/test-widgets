<script lang="ts">
	import ApiSection from '../api-section.svelte'

	interface Props {
		lastError: Error | null
	}

	const { lastError }: Props = $props()
</script>

<ApiSection
	class="flex-col gap-4"
	{lastError}
>
	<p>content</p>
</ApiSection>

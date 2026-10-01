<script lang="ts">
	import ApiSection from '../api-section.svelte'

	const throwError = (): string => {
		throw new Error('bad news bears')
	}
</script>

<ApiSection title="Broken">
	{@const message = throwError()}
	<p>{message}</p>
</ApiSection>

<ApiSection title="Healthy">
	<p>still standing</p>
</ApiSection>

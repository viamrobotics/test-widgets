<script lang="ts">
	import ApiSection from '../api-section.svelte'

	const throwError = (): string => {
		throw new Error('bad news bears')
	}
</script>

<ApiSection class="flex-col gap-4">
	{#snippet heading()}Broken{/snippet}
	{@const message = throwError()}
	<p>{message}</p>
</ApiSection>

<ApiSection class="flex-col gap-4">
	{#snippet heading()}Healthy{/snippet}
	<p>still standing</p>
</ApiSection>

<ApiSection
	class="flex-col gap-4"
	method="GetPosition"
	api="rdk:component:servo"
>
	{#snippet subheading()}Where the servo is{/snippet}
	{#snippet description()}Updates automatically{/snippet}
	<p>42.5</p>
</ApiSection>

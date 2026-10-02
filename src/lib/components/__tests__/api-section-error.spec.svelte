<script lang="ts">
	import { ResourceTriplets } from '$lib/resource-triplet'

	import ApiSection from '../api-section.svelte'
	import { Section } from '../section'

	const throwError = (): string => {
		throw new Error('bad news bears')
	}
</script>

<ApiSection
	class="flex-col gap-4"
	method="IsMoving"
	api={ResourceTriplets.Servo}
>
	{@const message = throwError()}
	<p>{message}</p>
</ApiSection>

<ApiSection
	class="flex-col gap-4"
	method="Stop"
	api={ResourceTriplets.Servo}
>
	<p>still standing</p>
</ApiSection>

<ApiSection
	class="flex-col gap-4"
	method="GetPosition"
	api={ResourceTriplets.Servo}
>
	{#snippet subheading()}<Section.Text>Where the servo is</Section.Text>{/snippet}
	{#snippet tooltip()}Degrees from zero{/snippet}
	<p>42.5</p>
	<Section.Text class="mt-auto">Updates automatically</Section.Text>
</ApiSection>

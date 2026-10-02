<script lang="ts">
	import { ResourceTriplets } from '$lib/resource-triplet'

	import type { SectionQuery } from '../section/use-section-errors.svelte'

	import ApiSection from '../api-section.svelte'
	import { Section } from '../section'

	interface Props {
		queries: SectionQuery[]
	}

	const { queries }: Props = $props()
</script>

<ApiSection
	class="flex-col gap-4"
	method="GetPosition"
	api={ResourceTriplets.Gantry}
	{queries}
	skeleton
>
	<p>Position <Section.Placeholder /></p>
</ApiSection>

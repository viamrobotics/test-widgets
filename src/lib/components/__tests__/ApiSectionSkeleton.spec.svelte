<script lang="ts">
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import type { SectionQuery } from '../Section/use-section-errors.svelte'

	import ApiSection from '../ApiSection.svelte'
	import { Section } from '../Section'

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

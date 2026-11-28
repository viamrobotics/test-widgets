<script lang="ts">
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import type { SectionQuery } from '../Section/use-section-errors.svelte'

	import ApiSection from '../ApiSection.svelte'

	interface Props {
		queries: SectionQuery[]
		lastError?: Error | null
	}

	const { queries, lastError = null }: Props = $props()
</script>

<ApiSection
	class="flex-col gap-4"
	method="GetPosition"
	api={ResourceTriplets.Servo}
	{queries}
	mutations={[{ error: lastError }]}
>
	<p>content</p>
</ApiSection>

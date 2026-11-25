<script lang="ts">
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import ApiSection from '../../ApiSection.svelte'

	interface Props {
		innerError?: Error | null
	}

	const { innerError = null }: Props = $props()
</script>

<ApiSection
	method="IsMoving"
	api={ResourceTriplets.Motor}
	mutations={[{ error: null }]}
	data-testid="outer"
>
	<ApiSection
		method="IsPowered"
		api={ResourceTriplets.Motor}
		mutations={[{ error: innerError }]}
		data-testid="inner"
	>
		<p>powered</p>
	</ApiSection>
</ApiSection>

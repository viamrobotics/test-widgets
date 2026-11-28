<script lang="ts">
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import { Section } from '..'

	interface Props {
		description?: string
	}

	const { description }: Props = $props()
</script>

<Section.Scope
	method="GetPosition"
	api={ResourceTriplets.Motor}
	{description}
	mutations={[]}
>
	<Section.Docs />
</Section.Scope>

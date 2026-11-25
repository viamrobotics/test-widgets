<script lang="ts">
	import { ResourceTriplets } from '#lib/resource-triplet.js'

	import type { SectionQuery } from '../use-section-errors.svelte'

	import { Section } from '..'
	import ApiSection from '../../ApiSection.svelte'

	interface Props {
		queries?: SectionQuery[]
		mutationError?: Error | null
		showBody?: boolean
	}

	const { queries = [], mutationError = null, showBody = true }: Props = $props()
</script>

<Section.Scope>
	<div data-testid="pane-header">
		<h3><Section.Method /></h3>
		<Section.Docs />
		<Section.Errors />
	</div>
	<div data-testid="pane-body">
		<Section.Loading />
		{#if showBody}
			<ApiSection
				method="SetPower"
				api={ResourceTriplets.Motor}
				{queries}
				mutations={[{ error: mutationError }]}
			>
				{#snippet subheading()}<Section.Text>Move continuously</Section.Text>{/snippet}
				{#snippet tooltip()}Sets the motor's power{/snippet}
				<button type="button">Execute</button>
			</ApiSection>
		{/if}
	</div>
</Section.Scope>

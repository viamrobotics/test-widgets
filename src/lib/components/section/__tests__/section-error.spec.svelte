<script lang="ts">
	import { ResourceTriplets } from '$lib/resource-triplet'

	import { Section } from '..'
	import ApiSection from '../../api-section.svelte'

	interface Props {
		error: Error | null
		mutationError?: Error | null
		showForm?: boolean
	}

	const { error, mutationError = null, showForm = true }: Props = $props()
</script>

<ApiSection
	class="flex-col gap-4"
	method="Open"
	api={ResourceTriplets.Gripper}
	mutations={[{ error: mutationError }]}
>
	{#if showForm}
		<form>
			<button type="submit">Open</button>
			<Section.Error {error} />
		</form>
	{/if}
</ApiSection>

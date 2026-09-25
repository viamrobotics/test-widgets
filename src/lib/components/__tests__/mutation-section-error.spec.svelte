<script lang="ts">
	import MutationSection from '../mutation-section.svelte'

	const throwError = (): string => {
		throw new Error('bad news bears')
	}
</script>

<MutationSection
	title="Broken"
	lastError={null}
>
	{@const message = throwError()}
	<p>{message}</p>
</MutationSection>

<MutationSection
	title="Healthy"
	lastError={null}
>
	<p>still standing</p>
</MutationSection>

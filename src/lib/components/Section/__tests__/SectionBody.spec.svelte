<script lang="ts">
	import { Section } from '..'
	import Control from './SectionBodyControl.spec.svelte'

	interface Props {
		isLoading: boolean
		skeleton: boolean
	}

	const { isLoading, skeleton }: Props = $props()
</script>

<Section.Body
	{isLoading}
	{skeleton}
>
	<p>Position <Section.Placeholder /></p>
	<Control />
</Section.Body>

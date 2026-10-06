<script lang="ts">
	import { Section } from '..'
	import Control from './section-body-control.spec.svelte'

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

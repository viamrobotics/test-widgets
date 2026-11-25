<script lang="ts">
	import { Section } from '..'

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
	<p>Position</p>
</Section.Body>

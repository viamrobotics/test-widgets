<script lang="ts">
	import ScrubInput from '../../scrub-input.svelte'

	interface Props {
		step: number
		value: number
		'aria-describedby'?: string
	}

	let { step, value = $bindable(), ...rest }: Props = $props()
</script>

<ScrubInput
	{...rest}
	{step}
	bind:value
/>
<output data-testid="bound">{value}</output>

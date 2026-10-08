<script lang="ts">
	import type { ComponentProps } from 'svelte'

	import PoseField from '../../pose-field.svelte'

	interface Props extends Omit<ComponentProps<typeof PoseField>, 'value'> {
		value: number
		onChange: (value: number) => void
	}

	const { value, onChange, ...rest }: Props = $props()
</script>

<PoseField
	{...rest}
	bind:value={() => value, onChange}
/>

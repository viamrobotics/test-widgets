<script lang="ts">
	interface Props {
		/** The id the disabled button names in `aria-describedby`. */
		id: string
	}

	const { id }: Props = $props()

	const MISSING_PIN_HINT = 'Enter a pin in the Pin field above.'
</script>

<p
	{id}
	class="text-subtle-1 text-xs"
>
	{MISSING_PIN_HINT}
</p>

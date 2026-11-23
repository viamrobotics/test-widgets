<script lang="ts">
	import { formatNumeric } from '$lib/format'

	interface Props {
		data: number
	}

	const { data }: Props = $props()
</script>

<span class="font-roboto-mono flex flex-row gap-2">
	{formatNumeric(data, 1)}
	<abbr
		class="text-subtle-2"
		title="percent">%</abbr
	>
</span>

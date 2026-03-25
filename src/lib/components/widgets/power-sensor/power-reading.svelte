<script lang="ts">
	import { formatNumeric } from '$lib/format'

	interface Props {
		data: number
	}

	const { data }: Props = $props()
</script>

<span class="font-roboto-mono flex flex-row gap-2">
	{formatNumeric(data, 4)}
	<abbr class="text-subtle-2">W</abbr>
</span>

<script lang="ts">
	import { formatNumeric } from '$lib/format';

	interface Props {
		data: readonly [number, boolean];
	}

	const { data }: Props = $props();

	const voltage = $derived(data[0]);
	const isAC = $derived(data[1]);
</script>

<span class="font-roboto-mono flex flex-row gap-2">
	{formatNumeric(voltage, 4)}
	<abbr class="text-subtle-2">V</abbr>
	<abbr class="text-subtle-2">({isAC ? 'AC' : 'DC'})</abbr>
</span>

<script lang="ts">
	import { formatNumeric } from '#lib/format.js'

	interface Props {
		data: readonly [number, boolean]
		isChargingSupported: boolean
	}

	const { data, isChargingSupported }: Props = $props()

	const percent = $derived(data[0])
	const isCharging = $derived(data[1])
</script>

<span class="font-roboto-mono flex flex-row gap-2">
	{formatNumeric(percent, 1)}
	<abbr
		class="text-subtle-2"
		title="percent">%</abbr
	>
	{#if isChargingSupported}
		<span class="text-subtle-2">({isCharging ? 'charging' : 'not charging'})</span>
	{/if}
</span>

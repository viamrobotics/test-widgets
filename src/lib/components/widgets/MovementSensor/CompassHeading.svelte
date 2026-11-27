<script lang="ts">
	import { formatNumeric } from '#lib/format.js'

	interface Props {
		data: number
	}

	const { data }: Props = $props()

	const labelId = $props.id()
</script>

<div class="flex min-w-0 items-center gap-2">
	<span
		id={labelId}
		class="text-subtle-1 w-14 shrink-0 text-xs"
	>
		Heading
	</span>
	<span
		role="group"
		aria-labelledby={labelId}
		class="readout font-roboto-mono"
	>
		<span class="readout-value">{formatNumeric(data)}</span>
		<span class="readout-suffix">°</span>
	</span>
	<svg
		width="32"
		height="32"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
		class="ml-auto shrink-0"
		style:transform="rotate({data}deg)"
	>
		<circle
			cx="16"
			cy="16"
			r="15.5"
			class="stroke-gray-4 fill-white"
		/>
		<path
			d="m16 3 2.6 4.5h-5.2L16 3Z"
			class="fill-danger-dark"
		/>
		<path
			d="m29 16-4.5 2.6v-5.2L29 16ZM3 16l4.5 2.6v-5.2L3 16Zm13 13 2.6-4.5h-5.2L16 29Z"
			class="fill-gray-5"
		/>
		<path
			d="M17.2 10.2h1.2V16h-1.1l-2.7-4v4h-1.2v-5.8h1.1l2.7 3.8v-3.8Z"
			class="fill-danger-dark"
		/>
	</svg>
</div>

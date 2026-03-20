<script lang="ts">
	import { formatNumeric } from '$lib/format'

	interface Props {
		data: number
	}

	const { data }: Props = $props()
</script>

<div class="flex items-center gap-3">
	<svg
		width="32"
		height="32"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		class="transition-transform duration-1000 ease-in-out"
		style:transform="rotate({data}deg)"
	>
		<circle
			cx="16"
			cy="16"
			r="15.5"
			fill="#fff"
			stroke="#D7D7D9"
		/>
		<path
			d="m16 3 2.6 4.5h-5.2L16 3Z"
			fill="#BE3536"
		/>
		<path
			d="m29 16-4.5 2.6v-5.2L29 16ZM3 16l4.5 2.6v-5.2L3 16Zm13 13 2.6-4.5h-5.2L16 29Z"
			fill="#C5C6CC"
		/>
		<path
			d="M17.2 10.2h1.2V16h-1.1l-2.7-4v4h-1.2v-5.8h1.1l2.7 3.8v-3.8Z"
			fill="#BE3536"
		/>
	</svg>

	<div class="text-subtle-1 font-mono">
		{formatNumeric(data)}
	</div>
</div>

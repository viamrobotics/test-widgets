<script lang="ts">
	import type { AngleUnit, OrientationFormat } from '../../orientation-format'

	import OrientationFormatMenu from '../../orientation-format-menu.svelte'

	interface Props {
		initialFormat: OrientationFormat
		initialUnit: AngleUnit
		onFormatChange: (format: OrientationFormat) => void
		onUnitChange: (unit: AngleUnit) => void
	}

	const { initialFormat, initialUnit, onFormatChange, onUnitChange }: Props = $props()

	let format = $derived(initialFormat)
	let unit = $derived(initialUnit)
</script>

<OrientationFormatMenu
	bind:format={
		() => format,
		(next) => {
			format = next
			onFormatChange(next)
		}
	}
	bind:unit={
		() => unit,
		(next) => {
			unit = next
			onUnitChange(next)
		}
	}
	labelId="orientation-label"
/>

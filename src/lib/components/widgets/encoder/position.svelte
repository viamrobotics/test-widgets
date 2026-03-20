<script lang="ts">
	import { EncoderPositionType } from '@viamrobotics/sdk'

	import { formatNumeric } from '$lib/format'

	interface Props {
		position: number
		encoderPositionType: EncoderPositionType
	}

	const { position, encoderPositionType }: Props = $props()
</script>

{#if encoderPositionType === EncoderPositionType.ANGLE_DEGREES}
	<span class=" flex flex-row gap-0.5">
		{formatNumeric(position, 1)}
		<abbr class="text-subtle-2">º</abbr>
	</span>
{:else if encoderPositionType === EncoderPositionType.TICKS_COUNT}
	<span class=" flex flex-row gap-1">
		{formatNumeric(position, 2)}
		<abbr class="text-subtle-2">ticks</abbr>
	</span>
{:else}
	{formatNumeric(position, 2)}
{/if}

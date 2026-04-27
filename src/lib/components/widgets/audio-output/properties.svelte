<script lang="ts">
	interface Props {
		supportedCodecs: string[]
		sampleRateHz: number
		numChannels: number
	}

	const { supportedCodecs, sampleRateHz, numChannels }: Props = $props()
</script>

<dl class="font-roboto-mono flex flex-col gap-y-2 text-sm">
	<div class="flex flex-row">
		<dt class="text-default w-50 min-w-50 pr-2 font-medium">Supported Codecs</dt>
		<dd class="text-subtle-1">
			{supportedCodecs.length > 0 ? supportedCodecs.join(', ') : 'None'}
		</dd>
	</div>
	<div class="flex flex-row">
		<dt class="text-default w-50 min-w-50 pr-2 font-medium">Sample Rate</dt>
		<dd class="text-subtle-1">{sampleRateHz} Hz</dd>
	</div>
	<div class="flex flex-row">
		<dt class="text-default w-50 min-w-50 pr-2 font-medium">Channels</dt>
		<dd class="text-subtle-1">{numChannels}</dd>
	</div>
</dl>

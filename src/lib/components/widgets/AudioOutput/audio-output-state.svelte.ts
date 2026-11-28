import { createInFlightGuard, type InFlightGuard } from '#lib/components/in-flight-guard.svelte.js'
import { defineResourceState } from '#lib/resource-widget-state.js'

/** What every widget for one audio output shares below one `WidgetsProvider`. */
interface AudioOutputState {
	/**
	 * Every call that drives the speaker, Play and PlayStream. Two clips or streams at once would
	 * talk over each other, so they share one group. GetProperties stays live.
	 */
	playback: InFlightGuard
}

/** Returns the state the audio output widgets naming one `partID` and `resourceName` share. */
export const useAudioOutputState = defineResourceState<AudioOutputState>('audio output', () => ({
	playback: createInFlightGuard(),
}))

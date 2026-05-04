import type { ComponentProps } from 'svelte'

import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'

import Subject from '../properties.svelte'

const renderSubject = (props: Partial<ComponentProps<typeof Subject>> = {}) =>
	render(Subject, {
		supportedCodecs: [],
		sampleRateHz: 0,
		numChannels: 0,
		...props,
	})

describe('AudioInput Properties', () => {
	it('displays supported codecs', () => {
		renderSubject({ supportedCodecs: ['mp3', 'pcm16'] })
		expect(screen.getByText('mp3, pcm16')).toBeInTheDocument()
	})

	it('displays None when no codecs are supported', () => {
		renderSubject({ supportedCodecs: [] })
		expect(screen.getByText('None')).toBeInTheDocument()
	})

	it('displays sample rate', () => {
		renderSubject({ sampleRateHz: 48000 })
		expect(screen.getByText('48000 Hz')).toBeInTheDocument()
	})

	it('displays number of channels', () => {
		renderSubject({ numChannels: 2 })
		expect(screen.getByText('2')).toBeInTheDocument()
	})
})

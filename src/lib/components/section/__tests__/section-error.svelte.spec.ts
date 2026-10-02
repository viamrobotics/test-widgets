import { render, screen } from '@testing-library/svelte'
import { describe, expect, it } from 'vitest'

import SectionError from '../section-error.svelte'
import Subject from './section-error.spec.svelte'

const notPowered = () => {
	const error = new Error('gripper is not powered')
	error.name = 'RpcError'
	return error
}

const indicator = (name: string) => screen.getByRole('button', { name })

// The inline `ErrorDisplay` line. The indicator's tooltip also renders the error text, so the
// line is told apart by its copy button.
const inlineLine = () => screen.queryByRole('button', { name: 'Copy error' })

describe('<Section.Error>', () => {
	it("adds an inner form's error to the section's indicator instead of rendering it inline", () => {
		render(Subject, { error: notPowered() })

		expect(indicator('1 error, copy to clipboard')).toBeInTheDocument()
		expect(inlineLine()).not.toBeInTheDocument()
	})

	it('clears from the indicator when the error clears', async () => {
		const { rerender } = render(Subject, { error: notPowered() })

		await rerender({ error: null })

		expect(indicator('No errors')).toBeInTheDocument()
	})

	it('clears from the indicator when the form unmounts', async () => {
		const { rerender } = render(Subject, { error: notPowered() })

		await rerender({ error: notPowered(), showForm: false })

		expect(indicator('No errors')).toBeInTheDocument()
	})

	it("counts once when the section's own mutation fails the same way", () => {
		render(Subject, { error: notPowered(), mutationError: notPowered() })

		expect(indicator('1 error, copy to clipboard')).toBeInTheDocument()
	})

	it('renders the error inline outside a section', () => {
		render(SectionError, { error: notPowered() })

		expect(screen.getByText('RpcError: gripper is not powered')).toBeInTheDocument()
		expect(inlineLine()).toBeInTheDocument()
	})
})

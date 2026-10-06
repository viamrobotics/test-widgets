import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { MachineConfigs, NamedMachineConfig } from '../machine-config'

import Subject from '../machine-list.svelte'
import { parseMachineConfigs } from '../parse-machine-configs'

vi.mock('../parse-machine-configs', () => ({
	parseMachineConfigs: vi.fn(),
}))

const createConfig = (name: string): NamedMachineConfig => ({
	name,
	host: `${name}.example.com`,
	partId: `${name}-part`,
	signalingAddress: '',
})

describe('MachineList', () => {
	const add = vi.fn()
	const remove = vi.fn()

	const renderSubject = (names: string[], selectedName?: string) => {
		const machines: MachineConfigs = {
			current: names.map((name) => createConfig(name)),
			add,
			remove,
			isEnvConfig: (name) => name === 'env machine',
		}
		render(Subject, { machines, selectedName })
	}

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it('links each machine with an encoded machine query', () => {
		renderSubject(['env machine', 'stored'])

		const link = screen.getByRole('link', { name: /env machine/iu })

		expect(link.getAttribute('href')).toContain('?machine=env+machine')
		expect(screen.getByRole('link', { name: /stored/iu }).getAttribute('href')).toContain(
			'?machine=stored'
		)
	})

	it('marks only the selected machine as current', () => {
		renderSubject(['env machine', 'stored'], 'stored')

		expect(screen.getByRole('link', { name: /stored/iu })).toHaveAttribute('aria-current', 'page')
		expect(screen.getByRole('link', { name: /env machine/iu })).not.toHaveAttribute('aria-current')
	})

	it('offers removal only for stored machines', async () => {
		renderSubject(['env machine', 'stored'])

		expect(screen.queryByRole('button', { name: 'Remove env machine' })).not.toBeInTheDocument()

		await userEvent.click(screen.getByRole('button', { name: 'Remove stored' }))

		expect(remove).toHaveBeenCalledWith('stored')
	})

	it('shows an error and does not add invalid text', async () => {
		vi.mocked(parseMachineConfigs).mockReturnValue(undefined)
		renderSubject(['stored'])

		await userEvent.click(screen.getByText('Add a machine'))
		const field = screen.getByRole('textbox', { name: /machine config json/iu })
		await userEvent.type(field, 'nope')
		await userEvent.click(screen.getByRole('button', { name: 'Add machine' }))

		expect(screen.getByRole('alert')).toBeInTheDocument()
		expect(field).toHaveAttribute('aria-invalid', 'true')
		expect(add).not.toHaveBeenCalled()
	})

	it('adds parsed configs and clears the field', async () => {
		const configs = [createConfig('pasted')]
		vi.mocked(parseMachineConfigs).mockReturnValue(configs)
		renderSubject(['stored'])

		await userEvent.click(screen.getByText('Add a machine'))
		const field = screen.getByRole('textbox', { name: /machine config json/iu })
		await userEvent.type(field, 'valid')
		await userEvent.click(screen.getByRole('button', { name: 'Add machine' }))

		expect(parseMachineConfigs).toHaveBeenCalledWith('valid')
		expect(add).toHaveBeenCalledWith(configs)
		expect(field).toHaveValue('')
	})

	it('opens the add form only when there are no machines', () => {
		renderSubject([])
		expect(document.querySelector('details')).toHaveAttribute('open')
	})

	it('keeps the add form closed when machines exist', () => {
		renderSubject(['stored'])
		expect(document.querySelector('details')).not.toHaveAttribute('open')
	})
})

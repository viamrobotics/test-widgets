import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { appRobotApi, Struct } from '@viamrobotics/sdk'
import { createRawSnippet } from 'svelte'
import { describe, expect, it, vi } from 'vitest'

import type { ComponentPreview } from '../component-preview.ts'

import Subject from '../resources-list.svelte'

describe('<ResourcesList>', () => {
	it('renders empty state when no resources', () => {
		render(Subject, { data: [], previews: {} })
		expect(screen.getByText('No resources discovered')).toBeInTheDocument()
	})

	it('renders a list of resources sorted by name', () => {
		const data = [
			new appRobotApi.ComponentConfig({
				name: 'resource-b',
				model: 'model1',
				type: 'type1',
				attributes: Struct.fromJson({ key1: 'value1' }),
			}),
			new appRobotApi.ComponentConfig({
				name: 'resource-a',
				model: 'model2',
				type: 'type2',
				attributes: Struct.fromJson({ key2: 'value2' }),
			}),
		]

		render(Subject, { data, previews: {} })

		// Check if resources are rendered and sorted
		const items = screen.getAllByRole('term')
		expect(items).toHaveLength(2)
		expect(items[0]).toHaveTextContent('resource-a')
		expect(items[1]).toHaveTextContent('resource-b')

		// Verify JSON content is rendered
		expect(screen.getByText(/"name":\s*"resource-a"/u)).toBeInTheDocument()
		expect(screen.getByText(/"name":\s*"resource-b"/u)).toBeInTheDocument()
	})

	it('has a copy attributes button', () => {
		const data = [
			new appRobotApi.ComponentConfig({
				name: 'resource-a',
				model: 'model1',
				type: 'type1',
				attributes: Struct.fromJson({ key1: 'value1' }),
			}),
		]

		render(Subject, { data, previews: {} })

		const copyButton = screen.getByRole('button', {
			name: /copy attributes/iu,
		})

		expect(copyButton).toBeVisible()
	})

	it('has a add component button', async () => {
		const data = [
			new appRobotApi.ComponentConfig({
				name: 'resource-a',
				model: 'model1',
				type: 'type1',
				attributes: Struct.fromJson({ key1: 'value1' }),
			}),
		]

		const onAddComponent = vi.fn()
		render(Subject, { data, previews: {}, onAddComponent })

		const copyButton = screen.getByRole('button', {
			name: /add component/iu,
		})

		expect(copyButton).toBeVisible()

		await userEvent.click(copyButton)

		expect(onAddComponent).toHaveBeenCalledWith(data[0])
	})

	it('renders a component preview snippet', () => {
		const data = [
			new appRobotApi.ComponentConfig({
				name: 'resource-a',
				model: 'model1',
				type: 'type1',
				attributes: Struct.fromJson({ key1: 'value1' }),
			}),
			new appRobotApi.ComponentConfig({
				name: 'resource-b',
				model: 'model2',
				type: 'type2',
				attributes: Struct.fromJson({ key2: 'value2' }),
			}),
		]

		render(Subject, {
			data,
			previews: {
				[data[0]!.name]: {
					component: data[0]!,
					preview: 'preview-a',
					loading: false,
				},
				[data[1]!.name]: {
					component: data[1]!,
					preview: undefined,
					loading: true,
				},
			},
			componentPreview: createRawSnippet<[ComponentPreview]>((params) => {
				return {
					render: () => `<p>${params().loading ? 'Loading preview ...' : params().preview}</p>`,
				}
			}),
		})

		expect(screen.getByText('preview-a')).toBeInTheDocument()
		expect(screen.getByText('Loading preview ...')).toBeInTheDocument()
	})
})

import { render, screen, within } from '@testing-library/svelte'
import { Classification } from '@viamrobotics/sdk'
import { describe, expect, it } from 'vitest'

import Subject from '../classification-list.svelte'

const TABBY = new Classification({ className: 'tabby cat', confidence: 0.912 })
const TIGER = new Classification({ className: 'tiger cat', confidence: 0.054 })

describe('ClassificationList', () => {
	it('draws one row per classification with its confidence as a percentage', () => {
		render(Subject, { props: { classifications: [TABBY, TIGER] } })

		const rows = within(screen.getByRole('list', { name: 'Classifications' })).getAllByRole(
			'listitem'
		)

		expect(rows.map((row) => row.textContent?.replaceAll(/\s+/g, ' ').trim())).toEqual([
			'tabby cat 91.20 %',
			'tiger cat 5.40 %',
		])
	})

	it('reads - when there are no classifications', () => {
		render(Subject, { props: { classifications: [] } })

		expect(screen.getByRole('group', { name: 'Classifications' })).toHaveTextContent(
			'Classifications -'
		)
		expect(screen.queryByRole('list')).not.toBeInTheDocument()
	})
})

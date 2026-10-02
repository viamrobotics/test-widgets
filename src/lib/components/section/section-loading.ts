import { getContext, setContext } from 'svelte'

const SECTION_LOADING_KEY = Symbol('section-loading')

export const provideSectionLoading = (isLoading: () => boolean) => {
	return setContext(SECTION_LOADING_KEY, {
		get isLoading() {
			return isLoading()
		},
	})
}

export const useSectionLoading = (): ReturnType<typeof provideSectionLoading> =>
	getContext(SECTION_LOADING_KEY) ?? { isLoading: false }

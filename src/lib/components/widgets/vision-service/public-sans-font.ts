import type { provideFontFamilies } from 'threlte-uikit'

import publicSansInfo from './fonts/public-sans.json'
import publicSansPage from './fonts/public-sans.png?url'

type FontFamilies = Parameters<typeof provideFontFamilies>[0]
type FontInfo = Exclude<FontFamilies[string][keyof FontFamilies[string]], string | undefined>

let font: FontInfo | undefined

export const getPublicSansFont = (): FontInfo => {
	if (!font) {
		font = {
			...publicSansInfo,
			// uikit's type requires `outline`, which this generated font omits. uikit never reads it.
			info: { ...publicSansInfo.info, outline: 0 },
			pages: [new URL(publicSansPage, document.baseURI).href],
		}
	}
	return font
}

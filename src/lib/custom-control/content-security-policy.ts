/** The policy the host injects into every custom control artifact before rendering it. */
export const CUSTOM_CONTROL_CSP = [
	"default-src 'none'",
	"script-src 'unsafe-inline'",
	"style-src 'unsafe-inline'",
	'img-src data: blob:',
	'media-src blob:',
	'font-src data:',
	"connect-src 'none'",
	"base-uri 'none'",
	"form-action 'none'",
].join('; ')

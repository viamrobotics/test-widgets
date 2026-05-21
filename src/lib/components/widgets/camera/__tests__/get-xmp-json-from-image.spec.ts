import { describe, expect, it } from 'vitest'

import { getXmpJsonFromImageBytes } from '../get-xmp-json-from-image'

const buildJpegWithXmp = (xmpXml: string): Uint8Array => {
	const identifier = new TextEncoder().encode('http://ns.adobe.com/xap/1.0/\0')
	const xmpBytes = new TextEncoder().encode(xmpXml)
	const app1Length = 2 + identifier.length + xmpBytes.length
	const app1Segment = new Uint8Array(2 + app1Length)

	app1Segment[0] = 0xff
	app1Segment[1] = 0xe1
	app1Segment[2] = (app1Length >> 8) & 0xff
	app1Segment[3] = app1Length & 0xff
	app1Segment.set(identifier, 4)
	app1Segment.set(xmpBytes, 4 + identifier.length)

	return new Uint8Array([0xff, 0xd8, ...app1Segment, 0xff, 0xd9])
}

describe('getXmpJsonFromImageBytes', () => {
	it('returns null when the image has no XMP segment', () => {
		const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9])

		expect(getXmpJsonFromImageBytes(jpeg)).toBeNull()
	})

	it('parses viam:is360 from a JPEG XMP packet', () => {
		const xmpXml = `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description
      rdf:about=""
      xmlns:viam="https://www.viam.com/"
      viam:is360="true"
    />
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`

		const jpeg = buildJpegWithXmp(xmpXml)
		const xmpJson = getXmpJsonFromImageBytes(jpeg, 'image/jpeg')

		expect(xmpJson).toEqual({
			'viam:is360': 'true',
			'xmlns:rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
			'xmlns:viam': 'https://www.viam.com/',
			'xmlns:x': 'adobe:ns:meta/',
		})
	})
})

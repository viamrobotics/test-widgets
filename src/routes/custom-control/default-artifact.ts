/**
 * A self-contained control artifact for the demo page: it does the postMessage handshake by hand,
 * since a sandboxed srcdoc frame cannot load the SDK's guest build, prints the resource's
 * readings, and reports its height so the widget can size the frame.
 */
export const createDefaultArtifact = (resourceName: string) => {
	// Escape "<" so a resource name from the URL cannot close the inline script.
	const resource = JSON.stringify(resourceName).replaceAll('<', String.raw`<`)

	return `<!doctype html>
<html>
	<body style="margin: 0; padding: 12px; font-family: sans-serif">
		<h1 id="title" style="margin: 0 0 8px; font-size: 14px"></h1>
		<pre id="output" style="margin: 0; font-size: 12px">Waiting for the host...</pre>
		<script type="module">
			const resource = ${resource}
			const output = document.getElementById('output')
			document.getElementById('title').textContent = 'Readings from ' + resource
			let port
			let timer
			let requestCount = 0

			const requestReadings = () => {
				requestCount += 1
				port.postMessage({
					type: 'request',
					id: String(requestCount),
					resource,
					method: 'getReadings',
					args: [],
				})
			}

			const reportSize = () => {
				port?.postMessage({
					type: 'size',
					height: document.documentElement.getBoundingClientRect().height,
				})
			}

			new ResizeObserver(reportSize).observe(document.documentElement)

			window.addEventListener('message', (event) => {
				if (event.data?.type !== 'connect') return
				port = event.ports[0]
				port.onmessage = ({ data }) => {
					if (data.type === 'response') {
						output.textContent = JSON.stringify(data.result, null, 2)
					} else if (data.type === 'error') {
						output.textContent = data.error.kind + ': ' + data.error.message
					}
				}
				reportSize()
				requestReadings()
				clearInterval(timer)
				timer = setInterval(requestReadings, 2000)
			})

			parent.postMessage({ protocol: 'viam-post-message', version: 1, type: 'ready' }, '*')
		</script>
	</body>
</html>`
}

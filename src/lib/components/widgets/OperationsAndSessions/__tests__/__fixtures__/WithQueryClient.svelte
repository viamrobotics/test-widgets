<script
	lang="ts"
	module
>
	import type { Component } from 'svelte'

	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query'

	/**
	 * Props of the query client fixture. A spec binds `TProps` by annotating the fixture as
	 * `Component<WithQueryClientProps<ComponentProps<typeof Subject>>>`, because `render` reads a
	 * generic component's props at its constraint.
	 */
	export interface WithQueryClientProps<TProps extends object> {
		widget: Component<TProps>
		props: TProps
		client?: QueryClient
	}
</script>

<script
	lang="ts"
	generics="TProps extends object"
>
	const {
		widget: Widget,
		props,
		client = new QueryClient(),
	}: WithQueryClientProps<TProps> = $props()
</script>

<QueryClientProvider {client}>
	<Widget {...props} />
</QueryClientProvider>

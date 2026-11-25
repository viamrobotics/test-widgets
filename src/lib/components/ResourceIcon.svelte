<script lang="ts">
	import { mdiCheck } from '@mdi/js'
	import { Icon } from '@viamrobotics/prime-ui'
	import { ViamComponent, ViamService } from '@viamrobotics/prime-ui/icons'

	interface Props {
		type: string
	}

	const { type }: Props = $props()

	const getIcon = (resourceType: string) => {
		if (resourceType === 'component') {
			return ViamComponent
		}

		return resourceType === 'service' ? ViamService : undefined
	}

	const icon = $derived(getIcon(type))
</script>

<!-- 'check' is just a placeholder when there's not an icon -->
<Icon
	icon={icon ?? mdiCheck}
	class={['text-gray-6 shrink-0', { 'opacity-0': !icon }]}
/>

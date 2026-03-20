<script lang="ts">
	import { T } from '@threlte/core';
	import { type BufferGeometry, MathUtils } from 'three';

	import { CapsuleGeometry } from '@viamrobotics/motion-tools/lib';
	import type { GeoGeometry } from '@viamrobotics/sdk';

	import { AxesHelper } from '$lib/components/three';
	import { getColor } from './color';

	interface Props {
		obstacles: GeoGeometry[];
		hovered: string | null;
		setHovered: (_: string | null) => void;
		view: '2D' | '3D';
	}

	const { obstacles, hovered, setHovered, view }: Props = $props();

	const oncreate = (ref: BufferGeometry) => {
		ref.rotateX(-Math.PI / 2);
	};
</script>

{#each obstacles as obstacle, i (i)}
	{#if obstacle.location}
		<T.Group
			userData.lngLat={{
				lng: obstacle.location.longitude,
				lat: obstacle.location.latitude
			}}
		>
			{#each obstacle.geometries as geometry (geometry.label)}
				<T.Mesh
					position.x={(geometry.center?.x ?? 0) / 1000}
					position.y={(geometry.center?.y ?? 0) / 1000}
					position.z={(geometry.center?.z ?? 0) / 1000}
					rotation.y={MathUtils.degToRad(geometry.center?.theta ?? 0)}
					onpointerenter={() => setHovered(geometry.label)}
					onpointerleave={() => setHovered(null)}
				>
					{#if geometry.geometryType.case === 'box' && geometry.geometryType.value.dimsMm}
						{@const { x, y, z } = geometry.geometryType.value.dimsMm}

						<AxesHelper
							length={(Math.max(x, y, z) / 1000) * 1.25}
							width={0.002}
							depthTest={false}
							renderOrder={1}
						/>

						{#if view === '3D'}
							<T.BoxGeometry
								args={[x / 1000, y / 1000, z / 1000]}
								{oncreate}
							/>
						{:else}
							<T.PlaneGeometry
								args={[x / 1000, y / 1000]}
								{oncreate}
							/>
						{/if}
					{:else if geometry.geometryType.case === 'sphere'}
						<AxesHelper
							length={(geometry.geometryType.value.radiusMm / 1000) * 1.25}
							width={0.002}
							depthTest={false}
							renderOrder={1}
						/>

						{#if view === '3D'}
							<T.SphereGeometry
								args={[geometry.geometryType.value.radiusMm / 1000]}
								{oncreate}
							/>
						{:else}
							<T.CircleGeometry
								args={[geometry.geometryType.value.radiusMm / 1000]}
								{oncreate}
							/>
						{/if}
					{:else if geometry.geometryType.case === 'capsule'}
						{@const { radiusMm, lengthMm } = geometry.geometryType.value}

						<AxesHelper
							length={Math.max(radiusMm, lengthMm) / 1000}
							width={0.002}
							depthTest={false}
							renderOrder={1}
						/>

						<T
							is={new CapsuleGeometry(radiusMm / 1000, lengthMm / 1000)}
							{oncreate}
						/>
					{/if}

					<T.MeshPhongMaterial color={getColor(hovered, geometry.label)} />
				</T.Mesh>
			{/each}
		</T.Group>
	{/if}
{/each}

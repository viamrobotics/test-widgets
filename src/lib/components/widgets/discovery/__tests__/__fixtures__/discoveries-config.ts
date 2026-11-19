import { appRobotApi, Struct } from '@viamrobotics/sdk'

import type { JsonObject } from '../../flatten-attributes'

const CAMERA = 'rdk:component:camera'
const SWITCH = 'rdk:component:switch'

export const makeConfig = (name: string, api: string, model: string, attributes: JsonObject = {}) =>
	new appRobotApi.ComponentConfig({
		name,
		api,
		model,
		attributes: Struct.fromJson(structuredClone(attributes)),
	})

const webcamModel = 'viam:camera:webcam'

export const webcamModes = Array.from({ length: 6 }, (_, index) =>
	makeConfig(`IntegratedCamera-${index}`, CAMERA, webcamModel, {
		video_path: 'video0',
		width_px: index % 2 === 0 ? 640 : 1280,
		height_px: index % 2 === 0 ? 480 : 720,
		frame_rate: index < 3 ? 30 : 60,
	})
)

export const onvifStreams = [
	makeConfig('amcrest-url0', CAMERA, 'viam:camera:onvif', { url: 'rtsp://a/main' }),
	makeConfig('amcrest-url1', CAMERA, 'viam:camera:onvif', { url: 'rtsp://a/sub' }),
]

export const hueAxes = [
	makeConfig('color-x', SWITCH, 'viam:switch:hue-x', { id: 1 }),
	makeConfig('color-y', SWITCH, 'viam:switch:hue-y', { id: 1 }),
]

export const upnpEndpoints = [
	makeConfig('upnp-0-video', CAMERA, 'viam:camera:upnp', { path: '/a' }),
	makeConfig('upnp-1-video', CAMERA, 'viam:camera:upnp', { path: '/b' }),
]

export const fakeServices = [
	makeConfig('fake1', 'rdk:component:motor', 'viam:motor:fake'),
	makeConfig('fake2', 'rdk:component:sensor', 'viam:motor:fake'),
]

export const loneIndexed = makeConfig('solo-0', CAMERA, 'viam:camera:webcam', { video_path: 'v' })

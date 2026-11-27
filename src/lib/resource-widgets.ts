import type { ResourceName } from '@viamrobotics/sdk'

import type { ResourceWidgetDefinition, ResourceWidgetsEntry } from './resource-widget-types.ts'

import * as Arm from './components/widgets/Arm/index.ts'
import * as AudioInput from './components/widgets/AudioInput/index.ts'
import * as AudioOutput from './components/widgets/AudioOutput/index.ts'
import * as Base from './components/widgets/Base/index.ts'
import * as Board from './components/widgets/Board/index.ts'
import * as Button from './components/widgets/Button/index.ts'
import * as Camera from './components/widgets/Camera/index.ts'
import * as Discovery from './components/widgets/Discovery/index.ts'
import * as Encoder from './components/widgets/Encoder/index.ts'
import * as Gantry from './components/widgets/Gantry/index.ts'
import * as Gripper from './components/widgets/Gripper/index.ts'
import * as InputController from './components/widgets/InputController/index.ts'
import * as MLModel from './components/widgets/MLModel/index.ts'
import * as Motion from './components/widgets/Motion/index.ts'
import * as Motor from './components/widgets/Motor/index.ts'
import * as MovementSensor from './components/widgets/MovementSensor/index.ts'
import * as PowerSensor from './components/widgets/PowerSensor/index.ts'
import * as Sensor from './components/widgets/Sensor/index.ts'
import * as Servo from './components/widgets/Servo/index.ts'
import * as Slam from './components/widgets/Slam/index.ts'
import * as Switch from './components/widgets/Switch/index.ts'
import * as Vision from './components/widgets/Vision/index.ts'
import { getResourceAPI } from './get-resource-api.ts'
import { ResourceTriplets } from './resource-triplet.ts'

/**
 * Each resource's widget keys. Declaring them keeps the keys of `resourceWidgets` literal while its
 * type stays nameable in the emitted `.d.ts`, which the components' own `Props` are not.
 */
interface ResourceWidgetKeys {
	[ResourceTriplets.Arm]:
		| 'jog'
		| 'joints'
		| 'moveToJointPositions'
		| 'moveToPosition'
		| 'getJointPositions'
		| 'getEndPosition'
		| 'isMoving'
		| 'manualMode'
		| 'setManualMode'
		| 'getManualMode'
		| 'getProperties'
		| 'stop'
	[ResourceTriplets.Base]:
		| 'quickMove'
		| 'moveStraight'
		| 'spin'
		| 'setPower'
		| 'setVelocity'
		| 'isMoving'
		| 'stop'
		| 'getProperties'
	[ResourceTriplets.AudioInput]: 'getAudio' | 'getProperties' | 'listen'
	[ResourceTriplets.AudioOutput]:
		| 'play'
		| 'playStream'
		| 'getProperties'
		| 'holdToTalk'
		| 'playFile'
	[ResourceTriplets.Board]:
		| 'pins'
		| 'setGpio'
		| 'getGpio'
		| 'pwm'
		| 'setPwm'
		| 'pwmFrequency'
		| 'setPwmFrequency'
		| 'readAnalogReader'
		| 'writeAnalog'
		| 'getDigitalInterruptValue'
		| 'streamTicks'
		| 'setPowerMode'
		| 'pin'
		| 'analogReader'
		| 'digitalInterrupt'
		| 'powerMode'
	[ResourceTriplets.Button]: 'push'
	[ResourceTriplets.Camera]: 'liveFeed' | 'getImages' | 'getPointCloud' | 'getProperties'
	[ResourceTriplets.Discovery]: 'discoverResources' | 'resourcePreview'
	[ResourceTriplets.Encoder]: 'getPosition' | 'resetPosition' | 'getProperties' | 'zeroPosition'
	[ResourceTriplets.Gantry]:
		| 'home'
		| 'moveToPosition'
		| 'quickMove'
		| 'getPosition'
		| 'isMoving'
		| 'getLengths'
		| 'stop'
		| 'homingStatus'
	[ResourceTriplets.Gripper]:
		| 'openGrab'
		| 'status'
		| 'isHoldingSomething'
		| 'isMoving'
		| 'open'
		| 'grab'
		| 'stop'
		| 'getCurrentInputs'
		| 'goToInputs'
	[ResourceTriplets.InputController]: 'getEvents' | 'triggerEvent' | 'webGamepad'
	[ResourceTriplets.MLModel]: 'metadata' | 'infer'
	[ResourceTriplets.Motion]: 'move'
	[ResourceTriplets.Motor]:
		| 'quickMove'
		| 'move'
		| 'setPower'
		| 'setRpm'
		| 'goFor'
		| 'goTo'
		| 'isMoving'
		| 'resetZeroPosition'
		| 'getPosition'
		| 'getProperties'
		| 'stop'
		| 'isPowered'
	[ResourceTriplets.MovementSensor]:
		| 'getPosition'
		| 'getOrientation'
		| 'getCompassHeading'
		| 'getAccuracy'
		| 'getLinearVelocity'
		| 'getAngularVelocity'
		| 'getLinearAcceleration'
		| 'getProperties'
		| 'getReadings'
		| 'positionMap'
	[ResourceTriplets.Navigation]: never
	[ResourceTriplets.PowerSensor]:
		| 'getVoltage'
		| 'getCurrent'
		| 'getPower'
		| 'getBatteryPercent'
		| 'getReadings'
		| 'readingHistory'
	[ResourceTriplets.Sensor]: 'getReadings'
	[ResourceTriplets.Servo]: 'move' | 'quickMove' | 'moveTo' | 'isMoving' | 'getPosition' | 'stop'
	[ResourceTriplets.Slam]:
		| 'map'
		| 'moveOnMap'
		| 'getPosition'
		| 'getPointCloudMap'
		| 'getProperties'
		| 'getInternalState'
	[ResourceTriplets.Switch]: 'setPosition' | 'getPosition' | 'getNumberOfPositions'
	[ResourceTriplets.Vision]:
		| 'overlayFeed'
		| 'captureAllFromCamera'
		| 'getProperties'
		| 'getObjectPointClouds'
		| 'getDetectionsFromCamera'
		| 'getClassificationsFromCamera'
		| 'getDetections'
		| 'getClassifications'
}

/** The declared type of `resourceWidgets`: each triplet's entry, with exactly its own keys. */
type ResourceWidgetsCatalog = {
	[Triplet in keyof ResourceWidgetKeys]: {
		widgets: Record<ResourceWidgetKeys[Triplet], ResourceWidgetDefinition>
	}
}

/**
 * Every resource's widgets, keyed by API triplet. Importing this pulls every widget, and its
 * optional peers, into the build, which is why the catalog sits on the `./widgets` entry and not
 * the root. A host that renders one widget imports it from the root and pays for nothing else.
 *
 * Each key is a method or control name in camelCase. A resource whose widgets are not single-purpose
 * yet has an empty entry.
 */
export const resourceWidgets: ResourceWidgetsCatalog = {
	[ResourceTriplets.Arm]: {
		widgets: {
			jog: { component: Arm.Jog, kind: 'control' },
			joints: { component: Arm.Joints, kind: 'control' },
			moveToJointPositions: { component: Arm.MoveToJointPositions, kind: 'api' },
			moveToPosition: { component: Arm.MoveToPosition, kind: 'api' },
			getJointPositions: { component: Arm.GetJointPositions, kind: 'api' },
			getEndPosition: { component: Arm.GetEndPosition, kind: 'api' },
			isMoving: { component: Arm.IsMoving, kind: 'api' },
			manualMode: { component: Arm.ManualMode, kind: 'control' },
			setManualMode: { component: Arm.SetManualMode, kind: 'api' },
			getManualMode: { component: Arm.GetManualMode, kind: 'api' },
			getProperties: { component: Arm.GetProperties, kind: 'api' },
			stop: { component: Arm.Stop, kind: 'api' },
		},
	},
	[ResourceTriplets.Base]: {
		widgets: {
			quickMove: {
				component: Base.QuickMove,
				kind: 'control',
			},
			moveStraight: {
				component: Base.MoveStraight,
				kind: 'api',
			},
			spin: {
				component: Base.Spin,
				kind: 'api',
			},
			setPower: {
				component: Base.SetPower,
				kind: 'api',
			},
			setVelocity: {
				component: Base.SetVelocity,
				kind: 'api',
			},
			isMoving: {
				component: Base.IsMoving,
				kind: 'api',
			},
			stop: {
				component: Base.Stop,
				kind: 'api',
			},
			getProperties: {
				component: Base.GetProperties,
				kind: 'api',
			},
		},
	},
	[ResourceTriplets.AudioInput]: {
		widgets: {
			getAudio: {
				component: AudioInput.GetAudio,
				kind: 'api',
			},
			getProperties: {
				component: AudioInput.GetProperties,
				kind: 'api',
			},
			listen: {
				component: AudioInput.Listen,
				kind: 'control',
			},
		},
	},
	[ResourceTriplets.AudioOutput]: {
		widgets: {
			play: {
				component: AudioOutput.Play,
				kind: 'api',
			},
			playStream: {
				component: AudioOutput.PlayStream,
				kind: 'api',
			},
			getProperties: {
				component: AudioOutput.GetProperties,
				kind: 'api',
			},
			holdToTalk: {
				component: AudioOutput.HoldToTalk,
				kind: 'control',
			},
			playFile: {
				component: AudioOutput.PlayFile,
				kind: 'control',
			},
		},
	},
	[ResourceTriplets.Board]: {
		widgets: {
			pins: {
				component: Board.Pins,
				kind: 'control',
			},
			setGpio: {
				component: Board.SetGpio,
				kind: 'api',
			},
			getGpio: {
				component: Board.GetGpio,
				kind: 'api',
			},
			pwm: {
				component: Board.Pwm,
				kind: 'api',
			},
			setPwm: {
				component: Board.SetPwm,
				kind: 'api',
			},
			pwmFrequency: {
				component: Board.PwmFrequency,
				kind: 'api',
			},
			setPwmFrequency: {
				component: Board.SetPwmFrequency,
				kind: 'api',
			},
			readAnalogReader: {
				component: Board.ReadAnalogReader,
				kind: 'api',
			},
			writeAnalog: {
				component: Board.WriteAnalog,
				kind: 'api',
			},
			getDigitalInterruptValue: {
				component: Board.GetDigitalInterruptValue,
				kind: 'api',
			},
			streamTicks: {
				component: Board.StreamTicks,
				kind: 'api',
			},
			setPowerMode: {
				component: Board.SetPowerMode,
				kind: 'api',
			},
			pin: {
				component: Board.Pin,
				kind: 'control',
			},
			analogReader: {
				component: Board.AnalogReader,
				kind: 'control',
			},
			digitalInterrupt: {
				component: Board.DigitalInterrupt,
				kind: 'control',
			},
			powerMode: {
				component: Board.PowerMode,
				kind: 'control',
			},
		},
	},
	[ResourceTriplets.Button]: {
		widgets: {
			push: {
				component: Button.Push,
				kind: 'api',
			},
		},
	},
	[ResourceTriplets.Camera]: {
		widgets: {
			liveFeed: {
				component: Camera.LiveFeed,
				kind: 'control',
			},
			getImages: {
				component: Camera.GetImages,
				kind: 'api',
			},
			getPointCloud: {
				component: Camera.GetPointCloud,
				kind: 'api',
			},
			getProperties: {
				component: Camera.GetProperties,
				kind: 'api',
			},
		},
	},
	[ResourceTriplets.Discovery]: {
		widgets: {
			discoverResources: {
				component: Discovery.DiscoverResources,
				kind: 'api',
			},
			resourcePreview: {
				component: Discovery.ResourcePreview,
				kind: 'control',
			},
		},
	},
	[ResourceTriplets.Encoder]: {
		widgets: {
			getPosition: {
				component: Encoder.GetPosition,
				kind: 'api',
			},
			resetPosition: {
				component: Encoder.ResetPosition,
				kind: 'api',
			},
			getProperties: {
				component: Encoder.GetProperties,
				kind: 'api',
			},
			zeroPosition: {
				component: Encoder.ZeroPosition,
				kind: 'control',
			},
		},
	},
	[ResourceTriplets.Gantry]: {
		widgets: {
			home: {
				component: Gantry.Home,
				kind: 'api',
			},
			moveToPosition: {
				component: Gantry.MoveToPosition,
				kind: 'api',
			},
			quickMove: {
				component: Gantry.QuickMove,
				kind: 'control',
			},
			getPosition: {
				component: Gantry.GetPosition,
				kind: 'api',
			},
			isMoving: {
				component: Gantry.IsMoving,
				kind: 'api',
			},
			getLengths: {
				component: Gantry.GetLengths,
				kind: 'api',
			},
			stop: {
				component: Gantry.Stop,
				kind: 'api',
			},
			homingStatus: {
				component: Gantry.HomingStatus,
				kind: 'control',
			},
		},
	},
	[ResourceTriplets.Gripper]: {
		widgets: {
			openGrab: {
				component: Gripper.OpenGrab,
				kind: 'control',
			},
			status: {
				component: Gripper.Status,
				kind: 'control',
			},
			isHoldingSomething: {
				component: Gripper.IsHoldingSomething,
				kind: 'api',
			},
			isMoving: {
				component: Gripper.IsMoving,
				kind: 'api',
			},
			open: {
				component: Gripper.Open,
				kind: 'api',
			},
			grab: {
				component: Gripper.Grab,
				kind: 'api',
			},
			stop: {
				component: Gripper.Stop,
				kind: 'api',
			},
			getCurrentInputs: {
				component: Gripper.GetCurrentInputs,
				kind: 'api',
			},
			goToInputs: {
				component: Gripper.GoToInputs,
				kind: 'api',
			},
		},
	},
	[ResourceTriplets.InputController]: {
		widgets: {
			getEvents: {
				component: InputController.GetEvents,
				kind: 'api',
			},
			triggerEvent: {
				component: InputController.TriggerEvent,
				kind: 'api',
			},
			webGamepad: {
				component: InputController.WebGamepad,
				kind: 'control',
			},
		},
	},
	[ResourceTriplets.MLModel]: {
		widgets: {
			metadata: {
				component: MLModel.Metadata,
				kind: 'api',
			},
			infer: {
				component: MLModel.Infer,
				kind: 'api',
			},
		},
	},
	[ResourceTriplets.Motion]: {
		widgets: {
			move: {
				component: Motion.Move,
				kind: 'api',
			},
		},
	},
	[ResourceTriplets.Motor]: {
		widgets: {
			quickMove: { component: Motor.QuickMove, kind: 'control' },
			move: { component: Motor.Move, kind: 'control' },
			setPower: { component: Motor.SetPower, kind: 'api' },
			setRpm: { component: Motor.SetRpm, kind: 'api' },
			goFor: { component: Motor.GoFor, kind: 'api' },
			goTo: { component: Motor.GoTo, kind: 'api' },
			isMoving: { component: Motor.IsMoving, kind: 'api' },
			resetZeroPosition: { component: Motor.ResetZeroPosition, kind: 'api' },
			getPosition: { component: Motor.GetPosition, kind: 'api' },
			getProperties: { component: Motor.GetProperties, kind: 'api' },
			stop: { component: Motor.Stop, kind: 'api' },
			isPowered: { component: Motor.IsPowered, kind: 'api' },
		},
	},
	[ResourceTriplets.MovementSensor]: {
		widgets: {
			getPosition: {
				component: MovementSensor.GetPosition,
				kind: 'api',
			},
			getOrientation: {
				component: MovementSensor.GetOrientation,
				kind: 'api',
			},
			getCompassHeading: {
				component: MovementSensor.GetCompassHeading,
				kind: 'api',
			},
			getAccuracy: {
				component: MovementSensor.GetAccuracy,
				kind: 'api',
			},
			getLinearVelocity: {
				component: MovementSensor.GetLinearVelocity,
				kind: 'api',
			},
			getAngularVelocity: {
				component: MovementSensor.GetAngularVelocity,
				kind: 'api',
			},
			getLinearAcceleration: {
				component: MovementSensor.GetLinearAcceleration,
				kind: 'api',
			},
			getProperties: {
				component: MovementSensor.GetProperties,
				kind: 'api',
			},
			getReadings: {
				component: MovementSensor.GetReadings,
				kind: 'api',
			},
			positionMap: {
				component: MovementSensor.PositionMap,
				kind: 'control',
			},
		},
	},
	[ResourceTriplets.Navigation]: {
		widgets: {},
	},
	[ResourceTriplets.PowerSensor]: {
		widgets: {
			getVoltage: {
				component: PowerSensor.GetVoltage,
				kind: 'api',
			},
			getCurrent: {
				component: PowerSensor.GetCurrent,
				kind: 'api',
			},
			getPower: {
				component: PowerSensor.GetPower,
				kind: 'api',
			},
			getBatteryPercent: {
				component: PowerSensor.GetBatteryPercent,
				kind: 'api',
			},
			getReadings: {
				component: PowerSensor.GetReadings,
				kind: 'api',
			},
			readingHistory: {
				component: PowerSensor.ReadingHistory,
				kind: 'control',
			},
		},
	},
	[ResourceTriplets.Sensor]: {
		widgets: {
			getReadings: { component: Sensor.GetReadings, kind: 'api' },
		},
	},
	[ResourceTriplets.Servo]: {
		widgets: {
			move: {
				component: Servo.Move,
				kind: 'api',
			},
			quickMove: {
				component: Servo.QuickMove,
				kind: 'control',
			},
			moveTo: {
				component: Servo.MoveTo,
				kind: 'control',
			},
			isMoving: {
				component: Servo.IsMoving,
				kind: 'api',
			},
			getPosition: {
				component: Servo.GetPosition,
				kind: 'api',
			},
			stop: {
				component: Servo.Stop,
				kind: 'api',
			},
		},
	},
	[ResourceTriplets.Slam]: {
		widgets: {
			map: {
				component: Slam.Map,
				kind: 'control',
			},
			moveOnMap: {
				component: Slam.MoveOnMap,
				kind: 'control',
			},
			getPosition: {
				component: Slam.GetPosition,
				kind: 'api',
			},
			getPointCloudMap: {
				component: Slam.GetPointCloudMap,
				kind: 'api',
			},
			getProperties: {
				component: Slam.GetProperties,
				kind: 'api',
			},
			getInternalState: {
				component: Slam.GetInternalState,
				kind: 'api',
			},
		},
	},
	[ResourceTriplets.Switch]: {
		widgets: {
			setPosition: {
				component: Switch.SetPosition,
				kind: 'control',
			},
			getPosition: {
				component: Switch.GetPosition,
				kind: 'api',
			},
			getNumberOfPositions: {
				component: Switch.GetNumberOfPositions,
				kind: 'api',
			},
		},
	},
	[ResourceTriplets.Vision]: {
		widgets: {
			overlayFeed: {
				component: Vision.OverlayFeed,
				kind: 'control',
			},
			captureAllFromCamera: {
				component: Vision.CaptureAllFromCamera,
				kind: 'api',
			},
			getProperties: {
				component: Vision.GetProperties,
				kind: 'api',
			},
			getObjectPointClouds: {
				component: Vision.GetObjectPointClouds,
				kind: 'api',
			},
			getDetectionsFromCamera: {
				component: Vision.GetDetectionsFromCamera,
				kind: 'api',
			},
			getClassificationsFromCamera: {
				component: Vision.GetClassificationsFromCamera,
				kind: 'api',
			},
			getDetections: {
				component: Vision.GetDetections,
				kind: 'api',
			},
			getClassifications: {
				component: Vision.GetClassifications,
				kind: 'api',
			},
		},
	},
}

const hasEntry = (api: string): api is keyof typeof resourceWidgets =>
	Object.hasOwn(resourceWidgets, api)

/**
 * Returns a resource's entry, or `undefined` for a resource with no widgets.
 *
 * @example
 * widgetsForResource(armResourceName)?.widgets.jog
 * // { component: Arm.Jog, kind: 'control' }
 */
export const widgetsForResource = (resource: ResourceName): ResourceWidgetsEntry | undefined => {
	const api = getResourceAPI(resource)
	return hasEntry(api) ? resourceWidgets[api] : undefined
}

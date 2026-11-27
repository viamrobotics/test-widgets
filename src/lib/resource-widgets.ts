import type { ResourceName } from '@viamrobotics/sdk'

import type { ResourceWidgetDefinition, ResourceWidgetsEntry } from './resource-widget-types.ts'

import {
	AudioInputGetPropertiesWidget,
	AudioOutputGetPropertiesWidget,
	EncoderGetPositionWidget,
	MLModelServiceMetadataWidget,
	MovementSensorGetAccuracyWidget,
	MovementSensorGetCompassHeadingWidget,
	MovementSensorGetOrientationWidget,
	MovementSensorGetPositionWidget,
	PowerSensorGetCurrentWidget,
	PowerSensorGetPowerWidget,
	PowerSensorGetVoltageWidget,
	SlamGetPositionWidget,
} from './components/index.ts'
import * as Arm from './components/widgets/Arm/index.ts'
import * as Base from './components/widgets/Base/index.ts'
import * as Board from './components/widgets/Board/index.ts'
import * as Button from './components/widgets/Button/index.ts'
import * as Gantry from './components/widgets/Gantry/index.ts'
import * as Gripper from './components/widgets/Gripper/index.ts'
import * as Motion from './components/widgets/Motion/index.ts'
import * as Motor from './components/widgets/Motor/index.ts'
import * as Sensor from './components/widgets/Sensor/index.ts'
import * as Servo from './components/widgets/Servo/index.ts'
import * as Switch from './components/widgets/Switch/index.ts'
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
	[ResourceTriplets.AudioInput]: 'getProperties'
	[ResourceTriplets.AudioOutput]: 'getProperties'
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
	[ResourceTriplets.Camera]: never
	[ResourceTriplets.Discovery]: never
	[ResourceTriplets.Encoder]: 'getPosition'
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
	[ResourceTriplets.InputController]: never
	[ResourceTriplets.MLModel]: 'metadata'
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
	[ResourceTriplets.Navigation]: never
	[ResourceTriplets.PowerSensor]: 'getVoltage' | 'getCurrent' | 'getPower'
	[ResourceTriplets.Sensor]: 'getReadings'
	[ResourceTriplets.Servo]: 'move' | 'quickMove' | 'moveTo' | 'isMoving' | 'getPosition' | 'stop'
	[ResourceTriplets.Slam]: 'getPosition'
	[ResourceTriplets.Switch]: 'setPosition' | 'getPosition' | 'getNumberOfPositions'
	[ResourceTriplets.Vision]: never
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
			getProperties: { component: AudioInputGetPropertiesWidget, kind: 'api' },
		},
	},
	[ResourceTriplets.AudioOutput]: {
		widgets: {
			getProperties: { component: AudioOutputGetPropertiesWidget, kind: 'api' },
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
		widgets: {},
	},
	[ResourceTriplets.Discovery]: {
		widgets: {},
	},
	[ResourceTriplets.Encoder]: {
		widgets: {
			getPosition: { component: EncoderGetPositionWidget, kind: 'api' },
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
		widgets: {},
	},
	[ResourceTriplets.MLModel]: {
		widgets: {
			metadata: { component: MLModelServiceMetadataWidget, kind: 'api' },
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
			getPosition: { component: MovementSensorGetPositionWidget, kind: 'api' },
			getOrientation: { component: MovementSensorGetOrientationWidget, kind: 'api' },
			getCompassHeading: { component: MovementSensorGetCompassHeadingWidget, kind: 'api' },
			getAccuracy: { component: MovementSensorGetAccuracyWidget, kind: 'api' },
		},
	},
	[ResourceTriplets.Navigation]: {
		widgets: {},
	},
	[ResourceTriplets.PowerSensor]: {
		widgets: {
			getVoltage: { component: PowerSensorGetVoltageWidget, kind: 'api' },
			getCurrent: { component: PowerSensorGetCurrentWidget, kind: 'api' },
			getPower: { component: PowerSensorGetPowerWidget, kind: 'api' },
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
			getPosition: { component: SlamGetPositionWidget, kind: 'api' },
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
		widgets: {},
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

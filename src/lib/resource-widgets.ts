import type { ResourceName } from '@viamrobotics/sdk'

import type { ResourceWidgetDefinition, ResourceWidgetsEntry } from './resource-widget-types.ts'

import {
	AudioInputGetPropertiesWidget,
	AudioOutputGetPropertiesWidget,
	BaseIsMovingWidget,
	BaseMoveStraightWidget,
	BaseQuickMoveWidget,
	BaseSetPowerWidget,
	BaseSetVelocityWidget,
	BaseSpinWidget,
	BaseStopWidget,
	EncoderGetPositionWidget,
	GantryGetPositionWidget,
	GantryHomeWidget,
	GantryIsMovingWidget,
	GantryMoveToPositionWidget,
	GantryQuickMoveWidget,
	GripperGrabWidget,
	GripperIsHoldingSomethingWidget,
	GripperIsMovingWidget,
	GripperOpenGrabWidget,
	GripperOpenWidget,
	GripperStopWidget,
	MLModelServiceMetadataWidget,
	MovementSensorGetAccuracyWidget,
	MovementSensorGetCompassHeadingWidget,
	MovementSensorGetOrientationWidget,
	MovementSensorGetPositionWidget,
	PowerSensorGetCurrentWidget,
	PowerSensorGetPowerWidget,
	PowerSensorGetVoltageWidget,
	ServoGetPositionWidget,
	ServoIsMovingWidget,
	ServoMoveWidget,
	ServoQuickMoveWidget,
	ServoStopWidget,
	SlamGetPositionWidget,
} from './components/index.ts'
import * as Arm from './components/widgets/Arm/index.ts'
import * as Motion from './components/widgets/Motion/index.ts'
import * as Motor from './components/widgets/Motor/index.ts'
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
	[ResourceTriplets.AudioInput]: 'getProperties'
	[ResourceTriplets.AudioOutput]: 'getProperties'
	[ResourceTriplets.Board]: never
	[ResourceTriplets.Button]: never
	[ResourceTriplets.Camera]: never
	[ResourceTriplets.Discovery]: never
	[ResourceTriplets.Encoder]: 'getPosition'
	[ResourceTriplets.Gantry]: 'home' | 'moveToPosition' | 'quickMove' | 'getPosition' | 'isMoving'
	[ResourceTriplets.Gripper]:
		| 'openGrab'
		| 'isHoldingSomething'
		| 'isMoving'
		| 'open'
		| 'grab'
		| 'stop'
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
	[ResourceTriplets.Sensor]: never
	[ResourceTriplets.Servo]: 'move' | 'quickMove' | 'isMoving' | 'getPosition' | 'stop'
	[ResourceTriplets.Slam]: 'getPosition'
	[ResourceTriplets.Switch]: never
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
			quickMove: { component: BaseQuickMoveWidget, kind: 'control' },
			moveStraight: { component: BaseMoveStraightWidget, kind: 'api' },
			spin: { component: BaseSpinWidget, kind: 'api' },
			setPower: { component: BaseSetPowerWidget, kind: 'api' },
			setVelocity: { component: BaseSetVelocityWidget, kind: 'api' },
			isMoving: { component: BaseIsMovingWidget, kind: 'api' },
			stop: { component: BaseStopWidget, kind: 'api' },
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
		widgets: {},
	},
	[ResourceTriplets.Button]: {
		widgets: {},
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
			home: { component: GantryHomeWidget, kind: 'api' },
			moveToPosition: { component: GantryMoveToPositionWidget, kind: 'api' },
			quickMove: { component: GantryQuickMoveWidget, kind: 'control' },
			getPosition: { component: GantryGetPositionWidget, kind: 'api' },
			isMoving: { component: GantryIsMovingWidget, kind: 'api' },
		},
	},
	[ResourceTriplets.Gripper]: {
		widgets: {
			openGrab: { component: GripperOpenGrabWidget, kind: 'control' },
			isHoldingSomething: { component: GripperIsHoldingSomethingWidget, kind: 'api' },
			isMoving: { component: GripperIsMovingWidget, kind: 'api' },
			open: { component: GripperOpenWidget, kind: 'api' },
			grab: { component: GripperGrabWidget, kind: 'api' },
			stop: { component: GripperStopWidget, kind: 'api' },
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
		widgets: {},
	},
	[ResourceTriplets.Servo]: {
		widgets: {
			move: { component: ServoMoveWidget, kind: 'api' },
			quickMove: { component: ServoQuickMoveWidget, kind: 'control' },
			isMoving: { component: ServoIsMovingWidget, kind: 'api' },
			getPosition: { component: ServoGetPositionWidget, kind: 'api' },
			stop: { component: ServoStopWidget, kind: 'api' },
		},
	},
	[ResourceTriplets.Slam]: {
		widgets: {
			getPosition: { component: SlamGetPositionWidget, kind: 'api' },
		},
	},
	[ResourceTriplets.Switch]: {
		widgets: {},
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
 * widgetsForResource(gripperResourceName)?.widgets.openGrab
 * // { component: GripperOpenGrabWidget, kind: 'control' }
 */
export const widgetsForResource = (resource: ResourceName): ResourceWidgetsEntry | undefined => {
	const api = getResourceAPI(resource)
	return hasEntry(api) ? resourceWidgets[api] : undefined
}

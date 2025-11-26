import {Zcl} from "zigbee-herdsman";
import * as m from 'zigbee-herdsman-converters/lib/modernExtend';
import * as fz from 'zigbee-herdsman-converters/converters/fromZigbee';
import * as tz from 'zigbee-herdsman-converters/converters/toZigbee';
import * as exposes from 'zigbee-herdsman-converters/lib/exposes';
import * as reporting from 'zigbee-herdsman-converters/lib/reporting';
const e = exposes.presets;
const ea = exposes.access;

/** @type{import('zigbee-herdsman-converters/lib/types').DefinitionWithExtend | import('zigbee-herdsman-converters/lib/types').DefinitionWithExtend[]} */
export default {
    zigbeeModel: ['WDE002497'],
    model: 'WDE002497',
    vendor: 'Schneider Electric',
    description: 'Smart thermostat',
    fromZigbee: [fz.stelpro_thermostat, fz.metering, fz.schneider_pilot_mode, fz.wiser_device_info, fz.hvac_user_interface, fz.temperature],
    toZigbee: [
            tz.thermostat_occupied_heating_setpoint,
            tz.thermostat_system_mode,
            tz.thermostat_running_state,
            tz.thermostat_local_temperature,
            tz.thermostat_control_sequence_of_operation,
            tz.schneider_pilot_mode,
            tz.schneider_thermostat_keypad_lockout,
            tz.thermostat_temperature_display_mode,
        ],
    exposes: [
        e.power(),
        e.energy(),
        e.binary('keypad_lockout', ea.STATE_SET, 'lock1', 'unlock').withDescription('Enables/disables physical input on the device'),
        e.enum('schneider_pilot_mode', ea.ALL, ['contactor', 'pilot']).withDescription('Controls piloting mode'),
        e.enum('temperature_display_mode', ea.ALL, ['celsius', 'fahrenheit']).withDescription('The temperature format displayed on the thermostat screen'),
        
        e.climate()
            .withSetpoint('occupied_heating_setpoint', 4, 30, 0.5)
            .withLocalTemperature()
            .withSystemMode(['off', 'heat'])
            .withRunningState(['idle', 'heat'])
            .withPiHeatingDemand(),
        e.temperature(),
    ],
    configure: async (device, coordinatorEndpoint) => {
        const endpoint1 = device.getEndpoint(1);
        const endpoint2 = device.getEndpoint(2);
        const endpoint5 = device.getEndpoint(5);
        await reporting.bind(endpoint1, coordinatorEndpoint, ['hvacThermostat']);
        await reporting.thermostatPIHeatingDemand(endpoint1);
        await reporting.thermostatOccupiedHeatingSetpoint(endpoint1);
        await reporting.bind(endpoint2, coordinatorEndpoint, ['msTemperatureMeasurement']);
        await reporting.temperature(endpoint2);
        await endpoint1.read('hvacUserInterfaceCfg', ['keypadLockout', 'tempDisplayMode']);
        await reporting.bind(endpoint5, coordinatorEndpoint, ['seMetering']);
        await reporting.instantaneousDemand(endpoint5, {min: 0, max: 60, change: 1});
        await reporting.readMeteringMultiplierDivisor(endpoint5);
        await reporting.currentSummDelivered(endpoint5, {min: 0, max: 60, change: 1});
    },
    extend: [
        m.deviceEndpoints({endpoints: {l1: 10, l2: 11}}),
        m.numeric({
            name: 'display_brightness_active',
            cluster: 'hvacUserInterfaceCfg',
            attribute: {ID: 0xe000, type: Zcl.DataType.UINT8},
            description: 'Sets brightness of the temperature display during active state',
            entityCategory: 'config',
            unit: '%',
            valueMin: 0,
            valueMax: 100,
            valueStep: 1,
            access: "ALL",
            zigbeeCommandOptions: {manufacturerCode: Zcl.ManufacturerCode.SCHNEIDER_ELECTRIC},
        }),
        m.numeric({
            name: 'display_brightness_inactive',
            cluster: 'hvacUserInterfaceCfg',
            attribute: {ID: 0xe001, type: Zcl.DataType.UINT8},
            description: 'Sets brightness of the temperature display during inactive state',
            entityCategory: 'config',
            unit: '%',
            valueMin: 0,
            valueMax: 100,
            valueStep: 1,
            access: "ALL",
            zigbeeCommandOptions: {manufacturerCode: Zcl.ManufacturerCode.SCHNEIDER_ELECTRIC},
        }),
        m.numeric({
            name: 'display_active_timeout',
            cluster: 'hvacUserInterfaceCfg',
            attribute: {ID: 0xe002, type: Zcl.DataType.UINT16},
            description: 'Sets timeout of the temperature display active state',
            entityCategory: 'config',
            unit: 'seconds',
            valueMin: 5,
            valueMax: 600,
            valueStep: 5,
            access: "ALL",
            zigbeeCommandOptions: {manufacturerCode: Zcl.ManufacturerCode.SCHNEIDER_ELECTRIC},
        }),
        m.enumLookup({
            name: 'control_type',
            lookup: { on_off: 0x00, pi: 0x01, no_control: 0xFF },
            cluster:'hvacThermostat',
            attribute: {ID: 0xE213, type: Zcl.DataType.UINT8},
            description: 'Control type',
            entityCategory: 'config',
            access: "ALL",
            zigbeeCommandOptions: {manufacturerCode: Zcl.ManufacturerCode.SCHNEIDER_ELECTRIC},
        }),
        m.numeric({
            name: 'fixed_load_demand',
            cluster: 'seMetering',
            attribute: {ID: 0x4510, type: Zcl.DataType.UINT24},
            description: 'Fixed load demand',
            entityCategory: 'config',
            unit: 'W',
            valueMin: 0,
            valueMax: 10000,
            valueStep: 1,
            access: "ALL",
            zigbeeCommandOptions: {manufacturerCode: Zcl.ManufacturerCode.SCHNEIDER_ELECTRIC},
        })
    ]
};

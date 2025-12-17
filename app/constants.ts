import type { SectionAItem, SectionBItem } from "./types";

export const COMPANY_NAME = "";
export const FORM_TITLE = "";

// Define raw list exactly as requested
const RAW_SECTION_A = [
  "Current Odometer reading:", // Special Input
  "Fire tender",
  "Power Steering Fluid",
  "Engine Oil Level",
  "Water Coolant Level",
  "Water/Oil Leaks",
  "Tires & Lug Nuts",
  "Head Lamps",
  "Turn Signals",
  "Hazard Lights",
  "Brake Lights",
  "Backup Beep",
  "Starter",
  "Emergency Brake",
  "Air Pressure Gauges",
  "Oil Pressure Gauge",
  "Battery Charging System",
  "Fuel Gauge",
  "Ignition Indication",
  "Siren",
  "Steering Fluid (ATF)",
  "Water Level in Reservoir",
  "Carry out brake hold test",
  "Carry Out Brake test",
  "Two Way Radio",
  "Jack & Wheel Spanner",
  "Wheel chocks",
  "First Aid Box",
  "Warning Triangle",
  "Park Brake Operation",
  "Glass (all) & Mirror",
  "Hydraulic Operations",
  "Sounds/Vibrations",
  "Air-Condition",
  "Spare tyre",
  "Gear Stick Sealed & Correct",
  "Seat Belt Condition",
  "Driver & Passenger Doors",
  "Beacon Light",
  "Air Horn",
  "Wiper & Washer Fluid",
  "Radiator Coolant Level",
  "6% AFFF Concentrate Level"
];

export const INITIAL_SECTION_A: SectionAItem[] = RAW_SECTION_A.map((label, index) => ({
  id: `a_${index}`,
  label: label.replace(':', ''), // Remove colon for display in label, add back in UI if needed
  type: label.includes("Odometer") ? 'input' : 'check',
  status: undefined,
  remarks: '',
  value: ''
}));

const RAW_SECTION_B = [
  "Engine Oil Level",
  "Fuel Level",
  "Gauge Operative",
  "Indicator Lamp",
  "Pump Running time (Hour)",
  "Delivery Pressure",
  "Flow rate"
];

export const INITIAL_SECTION_B: SectionBItem[] = RAW_SECTION_B.map((label, index) => {
  const isCheck = [
    "Engine Oil Level",
    "Fuel Level",
    "Gauge Operative",
    "Indicator Lamp"
  ].includes(label);

  return {
    id: `b_${index}`,
    label: label,
    type: isCheck ? 'check' : 'input',
    status: undefined,
    remarks: '',
    value: ''
  };
});

export enum InspectionStatus {
  OK = 'OK',
  DEFECTIVE = 'DEFECTIVE',
}

export interface SectionAItem {
  id: string;
  label: string;
  type: 'check' | 'input'; // Most are checks, Odometer is input
  status?: InspectionStatus;
  remarks?: string;
  value?: string; // For input types like Odometer
}

export interface SectionBItem {
  id: string;
  label: string;
  type: 'check' | 'input';
  status?: InspectionStatus;
  remarks?: string;
  value: string;
}

export interface HeaderData {
  vehicleReg: string;
  date: string;
  roadWorthiness: string;
  insurance: string;
}



export interface InspectionReport {
  _id?: string;
  id?: string;
  timestamp: number;
  inspectorName: string;
  header: HeaderData;
  sectionA: SectionAItem[];
  sectionB: SectionBItem[];

  isCompleted: boolean;
}

export interface User {
  id: string;
  name: string;
  role: 'inspector' | 'admin';
}

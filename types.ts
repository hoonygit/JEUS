
export enum CoveringType {
    HYBRIX = '하이브릭스',
    DOLCOM_BRIX = '돌콤브릭스',
    TRUSS = '트러스',
    TYVEK = '타이벡',
}

export interface BasicFarmInfo {
    id: string;
    name: string;
    contact: string;
    address: string;
    areaPyeong: number;
    cultivar: string;
    treeCount: number;
}

export interface FacilityInfo {
    slope: string;
    plantingDistance: string;
    hasCovering: boolean;
    coveringType?: CoveringType | '';
    hasPower: boolean;
    hasInternet: boolean;
    hasUmbrellaSystem: boolean;
    hasDripHose: boolean;
    hasSprinkler: boolean;
    hasWindbreak: boolean;
    hasOpener: boolean;
}

export interface SupportProgram {
    id: string;
    year: number;
    localGovtFund: number;
    selfFund: number;
    projectName: string;
    projectDescription: string;
    isSelected: boolean;
}

export interface ServiceInfo {
    jacheongbiId: string;
    jacheongbiPw: string;
    useSugarService: boolean;
    sugarMeterInfo?: string;
    useSensorService: boolean;
    sensorInfo?: string;
}

export interface AnnualData {
    id: string;
    year: number;
    avgBrix: number;
    hasAlternateBearing: boolean;
    estimatedYield: number;
    pricePerGwan: number;
    shippingSeason: string;
    notes: string;
}

export interface Farm {
    id: string;
    basicInfo: BasicFarmInfo;
    facilityInfo: FacilityInfo;
    supportPrograms: SupportProgram[];
    serviceInfo: ServiceInfo;
    annualData: AnnualData[];
}

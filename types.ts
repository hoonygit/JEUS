
export enum CoveringType {
    HYBRIX = '하이브릭스',
    DOLCOM_BRIX = '돌콤브릭스',
    TRUSS = '트러스',
    TYVEK = '타이벡',
}

export enum ConsultationCategory {
    CONSULTATION = '상담',
    PRUNING = '전정',
    PESTICIDE_FERTILIZER = '농약/비료',
    IRRIGATION = '관수',
    MULCHING = '멀칭',
    HARVEST = '수확',
    ETC = '기타',
}

export enum PredefinedProjectName {
    VARIETY_RENEWAL = '품종갱신',
    TREE_TRANSPLANT = '성목이식',
    SOIL_COVERING = '토양피목',
    PROVINCIAL_DATA = '도청데이터사업',
    MAFRA_DATA = '농림부데이터확산사업',
    UNIVERSITY_LINK = '대학연계사업',
    ETC = '기타',
}

export interface ConsultationLog {
    id: string;
    date: string;
    category: ConsultationCategory | '';
    content: string;
    notes: string;
}

export interface CorporateFarmDetails {
    year: number;
    consultationDate: string;
    estimatedQuantity: number;
    contractedQuantity: number;
    isContracted: boolean;
    specialNotes: string;
    contractDate?: string;
    downPayment?: number;
    balanceDueDate?: string;
    balancePayment?: number;
    mulchingWorkDate?: string;
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

export interface Plot {
    id: string;
    address: string;
    areaPyeong: number;
    cultivar: string;
    treeCount: number;
    isCorporate: boolean;
    facilityInfo: FacilityInfo;
    serviceInfo: ServiceInfo;
    annualData: AnnualData[];
    consultationLogs: ConsultationLog[];
    supportPrograms: SupportProgram[];
    corporateFarmDetails?: CorporateFarmDetails;
}

export interface Farm {
    id: string;
    name: string;
    contact: string;
    plots: Plot[];
}
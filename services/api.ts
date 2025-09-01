
import { Farm, Plot, CoveringType, ConsultationCategory, FacilityInfo, ServiceInfo } from '../types';

// 이 파일은 데이터 지속성을 관리하는 API 서비스 계층입니다.
// 현재는 브라우저의 localStorage를 사용하여 데이터를 저장하지만,
// 향후 실제 백엔드 서버와 연동하려면 이 파일의 함수 내부만 수정하면 됩니다.
// 예를 들어, fetch 또는 axios를 사용하여 REST API와 통신할 수 있습니다.

const STORAGE_KEY = 'citrusFarms';

// 실제 네트워크 통신을 흉내 내기 위한 가짜 지연 시간(ms)
const FAKE_DELAY = 500;

const BLANK_SERVICE_INFO: ServiceInfo = { jacheongbiId: '', jacheongbiPw: '', useSugarService: false, sugarMeterInfo: '', useSensorService: false, sensorInfo: '' };
const BLANK_FACILITY_INFO: FacilityInfo = { slope: '', plantingDistance: '', hasCovering: false, coveringType: '', hasPower: false, hasInternet: false, hasUmbrellaSystem: false, hasDripHose: false, hasSprinkler: false, hasWindbreak: false, hasOpener: false };


// localStorage에 데이터가 없을 때 사용할 초기 샘플 데이터
const initialFarms: Farm[] = [
    {
        id: 'farm-1',
        name: '햇살가득 농원',
        contact: '010-1234-5678',
        plots: [
            {
                id: 'plot-1',
                address: '제주특별자치도 서귀포시',
                areaPyeong: 2000,
                cultivar: '한라봉',
                treeCount: 500,
                isCorporate: false,
                facilityInfo: { slope: '10도', plantingDistance: '5m x 3m', hasCovering: true, coveringType: CoveringType.TYVEK, hasPower: true, hasInternet: true, hasUmbrellaSystem: false, hasDripHose: true, hasSprinkler: true, hasWindbreak: true, hasOpener: true },
                serviceInfo: { jacheongbiId: 'sunshine_farm', jacheongbiPw: 'password123', useSugarService: true, sugarMeterInfo: 'H-500 모델', useSensorService: true, sensorInfo: 'SKT 스마트팜' },
                annualData: [
                    { id: 'ad-1', year: 2023, avgBrix: 14.5, hasAlternateBearing: false, estimatedYield: 1000, pricePerGwan: 50000, shippingSeason: '1월-2월', notes: '품질 우수' }
                ],
                consultationLogs: [],
                supportPrograms: [
                    { id: 'sp-1', year: 2023, projectName: '스마트팜 보급사업', projectDescription: '온습도 센서 설치', localGovtFund: 5000000, selfFund: 2000000, isSelected: true }
                ],
            }
        ],
    },
    {
        id: 'farm-2',
        name: '제주오름 기업농',
        contact: '010-9876-5432',
        plots: [
            {
                id: 'plot-2',
                address: '제주특별자치도 제주시',
                areaPyeong: 1500,
                cultivar: '천혜향',
                treeCount: 400,
                isCorporate: true,
                facilityInfo: { slope: '5도', plantingDistance: '4m x 3m', hasCovering: false, hasPower: true, hasInternet: false, hasUmbrellaSystem: false, hasDripHose: true, hasSprinkler: false, hasWindbreak: true, hasOpener: false },
                serviceInfo: { jacheongbiId: 'oreum_farm', jacheongbiPw: 'password123', useSugarService: false, useSensorService: false },
                annualData: [
                     { id: 'ad-2', year: 2023, avgBrix: 13.8, hasAlternateBearing: true, estimatedYield: 700, pricePerGwan: 45000, shippingSeason: '2월-3월', notes: '해거리로 생산량 감소' }
                ],
                consultationLogs: [
                    { id: 'cl-1', date: '2024-05-15', category: ConsultationCategory.CONSULTATION, content: '초기 생육 상태 점검 및 시비 계획 논의', notes: '작년보다 생육 양호' },
                    { id: 'cl-2', date: '2024-06-20', category: ConsultationCategory.IRRIGATION, content: '가뭄 대비 관수 시스템 점검', notes: '일부 라인 수리 필요' },
                    { id: 'cl-3', date: '2024-07-15', category: ConsultationCategory.PESTICIDE_FERTILIZER, content: '총채벌레 방제 관련 약제 추천', notes: '' },
                ],
                supportPrograms: [],
                corporateFarmDetails: {
                    year: 2024,
                    consultationDate: '2024-05-10',
                    estimatedQuantity: 500,
                    contractedQuantity: 450,
                    isContracted: true,
                    specialNotes: '품질 우선 계약. 당도 14Brix 이상 보장 조건.',
                    contractDate: '2024-06-01',
                    downPayment: 10000000,
                    balanceDueDate: '2024-12-15',
                    balancePayment: 12500000,
                    mulchingWorkDate: '2024-07-20',
                }
            }
        ],
    }
];

const migrateData = (data: any[]): Farm[] => {
    if (!data || data.length === 0) return [];
    
    let migrationNeeded = false;

    const migrated = data.map((farm: any) => {
        const newFarm = { ...farm };
        
        // Migration Pass 1: Handle very old structure (farm.basicInfo)
        if (newFarm.basicInfo) {
            migrationNeeded = true;
            console.log(`Migrating farm "${newFarm.basicInfo.name}" from pre-plot structure.`);
            const { consultationLogs, ...corporateDetails } = newFarm.corporateFarmDetails || {};

            const plot: Omit<Plot, 'id'> = {
                address: newFarm.basicInfo.address,
                areaPyeong: newFarm.basicInfo.areaPyeong,
                cultivar: newFarm.basicInfo.cultivar,
                treeCount: newFarm.basicInfo.treeCount,
                isCorporate: newFarm.basicInfo.isCorporate,
                facilityInfo: newFarm.facilityInfo || BLANK_FACILITY_INFO,
                serviceInfo: newFarm.serviceInfo || BLANK_SERVICE_INFO,
                annualData: newFarm.annualData || [],
                consultationLogs: consultationLogs || [],
                supportPrograms: newFarm.supportPrograms || [],
                corporateFarmDetails: newFarm.corporateFarmDetails ? corporateDetails : undefined,
            };
            
            return {
                id: newFarm.id,
                name: newFarm.basicInfo.name,
                contact: newFarm.basicInfo.contact,
                plots: [{ ...plot, id: crypto.randomUUID() }],
            };
        }

        // Migration Pass 2: Move farm-level properties to the first plot
        let propsToMoveToFirstPlot: Partial<Plot> = {};
        // Fix: The properties being migrated here existed on an old 'Farm' type, but are now on 'Plot'.
        // Changed type from `(keyof Farm)[]` to `string[]` to reflect that these keys are not on the current Farm type.
        const farmLevelProps: string[] = ['isCorporate', 'supportPrograms', 'corporateFarmDetails', 'serviceInfo'];

        farmLevelProps.forEach((prop: any) => {
            if (newFarm[prop]) {
                migrationNeeded = true;
                if (prop === 'corporateFarmDetails') {
                    const { consultationLogs, ...details } = newFarm.corporateFarmDetails;
                    propsToMoveToFirstPlot.corporateFarmDetails = details;
                    propsToMoveToFirstPlot.consultationLogs = consultationLogs || [];
                } else {
                    (propsToMoveToFirstPlot as any)[prop] = newFarm[prop];
                }
                delete newFarm[prop];
            }
        });

        if (Object.keys(propsToMoveToFirstPlot).length > 0) {
             console.log(`Migrating farm-level properties for "${newFarm.name}".`);
            if (!newFarm.plots) newFarm.plots = [];
            if (newFarm.plots.length === 0) {
                newFarm.plots.push({ id: crypto.randomUUID(), address: '', areaPyeong: 0, cultivar: '', treeCount: 0 });
            }
            // Assign to first plot, ensuring existing plot data takes precedence
            newFarm.plots[0] = { ...propsToMoveToFirstPlot, ...newFarm.plots[0] };
        }
        
        // Migration Pass 3: Ensure all plots have default values for all required fields
        if (newFarm.plots) {
            newFarm.plots = newFarm.plots.map((p: any) => {
                 if (!p.id) {
                    migrationNeeded = true;
                    p.id = crypto.randomUUID();
                 }
                 const defaults: Partial<Plot> = {
                    isCorporate: false,
                    supportPrograms: [],
                    consultationLogs: [],
                    annualData: [],
                    serviceInfo: BLANK_SERVICE_INFO,
                    facilityInfo: BLANK_FACILITY_INFO,
                 };
                 Object.keys(defaults).forEach((key: any) => {
                    if (typeof p[key] === 'undefined') {
                        migrationNeeded = true;
                        p[key] = (defaults as any)[key];
                    }
                 });
                 return p;
            });
        } else {
            newFarm.plots = [];
        }

        return newFarm as Farm;
    });
    
    if (migrationNeeded) {
        console.log("Data migration complete. Saving new structure.");
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        } catch (e) {
            console.error("Failed to save migrated data to localStorage.", e);
        }
    }

    return migrated;
};


const getInitialData = (): Farm[] => {
    try {
        const savedFarmsJson = localStorage.getItem(STORAGE_KEY);
        if (savedFarmsJson) {
            const savedFarms = JSON.parse(savedFarmsJson);
            return migrateData(savedFarms);
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialFarms));
        return initialFarms;
    } catch (error) {
        console.error("localStorage에서 농가 데이터를 불러오는 중 오류가 발생했습니다.", error);
        return initialFarms;
    }
};


let farms: Farm[] = getInitialData();

const persistData = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(farms));
    } catch (error) {
        console.error("localStorage에 농가 데이터를 저장하는 중 오류가 발생했습니다.", error);
    }
};

export const farmApi = {
    /** 모든 농가 데이터를 비동기적으로 가져옵니다. */
    getAllFarms: (): Promise<Farm[]> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(JSON.parse(JSON.stringify(farms)));
            }, FAKE_DELAY);
        });
    },

    /** 단일 농가 데이터를 저장(생성 또는 업데이트)합니다. */
    saveFarm: (farmData: Farm): Promise<Farm> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const index = farms.findIndex(f => f.id === farmData.id);
                if (index > -1) {
                    farms[index] = farmData;
                } else {
                    farms.push(farmData);
                }
                persistData();
                resolve(JSON.parse(JSON.stringify(farmData)));
            }, FAKE_DELAY);
        });
    },

    /** ID를 기준으로 농가 데이터를 삭제합니다. */
    deleteFarm: (farmId: string): Promise<void> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                farms = farms.filter(f => f.id !== farmId);
                persistData();
                resolve();
            }, FAKE_DELAY);
        });
    },

    /** 모든 농가 데이터를 제공된 배열로 교체합니다. */
    replaceAllFarms: (newFarms: Farm[]): Promise<void> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (!Array.isArray(newFarms)) {
                    reject(new Error("Provided data is not an array."));
                    return;
                }
                farms = migrateData(newFarms); // Ensure restored data is in the new format
                persistData();
                resolve();
            }, FAKE_DELAY);
        });
    }
};
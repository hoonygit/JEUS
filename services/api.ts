
import { Farm, CoveringType, ConsultationCategory } from '../types';

// 이 파일은 데이터 지속성을 관리하는 API 서비스 계층입니다.
// 현재는 브라우저의 localStorage를 사용하여 데이터를 저장하지만,
// 향후 실제 백엔드 서버와 연동하려면 이 파일의 함수 내부만 수정하면 됩니다.
// 예를 들어, fetch 또는 axios를 사용하여 REST API와 통신할 수 있습니다.

const STORAGE_KEY = 'citrusFarms';

// 실제 네트워크 통신을 흉내 내기 위한 가짜 지연 시간(ms)
const FAKE_DELAY = 500;

// localStorage에 데이터가 없을 때 사용할 초기 샘플 데이터
const initialFarms: Farm[] = [
    {
        id: 'farm-1',
        basicInfo: { id: 'basic-1', name: '햇살가득 농원', contact: '010-1234-5678', address: '제주특별자치도 서귀포시', areaPyeong: 2000, cultivar: '한라봉', treeCount: 500, isCorporate: false },
        facilityInfo: { slope: '10도', plantingDistance: '5m x 3m', hasCovering: true, coveringType: CoveringType.TYVEK, hasPower: true, hasInternet: true, hasUmbrellaSystem: false, hasDripHose: true, hasSprinkler: true, hasWindbreak: true, hasOpener: true },
        supportPrograms: [
            { id: 'sp-1', year: 2023, projectName: '스마트팜 보급사업', projectDescription: '온습도 센서 설치', localGovtFund: 5000000, selfFund: 2000000, isSelected: true }
        ],
        serviceInfo: { jacheongbiId: 'sunshine_farm', jacheongbiPw: 'password123', useSugarService: true, sugarMeterInfo: 'H-500 모델', useSensorService: true, sensorInfo: 'SKT 스마트팜' },
        annualData: [
            { id: 'ad-1', year: 2023, avgBrix: 14.5, hasAlternateBearing: false, estimatedYield: 1000, pricePerGwan: 50000, shippingSeason: '1월-2월', notes: '품질 우수' }
        ]
    },
    {
        id: 'farm-2',
        basicInfo: { id: 'basic-2', name: '제주오름 기업농', contact: '010-9876-5432', address: '제주특별자치도 제주시', areaPyeong: 1500, cultivar: '천혜향', treeCount: 400, isCorporate: true },
        facilityInfo: { slope: '5도', plantingDistance: '4m x 3m', hasCovering: false, hasPower: true, hasInternet: false, hasUmbrellaSystem: false, hasDripHose: true, hasSprinkler: false, hasWindbreak: true, hasOpener: false },
        supportPrograms: [],
        serviceInfo: { jacheongbiId: 'oreum_farm', jacheongbiPw: 'password123', useSugarService: false, useSensorService: false },
        annualData: [
             { id: 'ad-2', year: 2023, avgBrix: 13.8, hasAlternateBearing: true, estimatedYield: 700, pricePerGwan: 45000, shippingSeason: '2월-3월', notes: '해거리로 생산량 감소' }
        ],
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
            consultationLogs: [
                { id: 'cl-1', date: '2024-05-15', category: ConsultationCategory.CONSULTATION, content: '초기 생육 상태 점검 및 시비 계획 논의', notes: '작년보다 생육 양호' },
                { id: 'cl-2', date: '2024-06-20', category: ConsultationCategory.IRRIGATION, content: '가뭄 대비 관수 시스템 점검', notes: '일부 라인 수리 필요' },
                { id: 'cl-3', date: '2024-07-15', category: ConsultationCategory.PESTICIDE_FERTILIZER, content: '총채벌레 방제 관련 약제 추천', notes: '' },
            ]
        }
    }
];

const getInitialData = (): Farm[] => {
    try {
        const savedFarms = localStorage.getItem(STORAGE_KEY);
        if (savedFarms) {
            return JSON.parse(savedFarms);
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
                farms = newFarms;
                persistData();
                resolve();
            }, FAKE_DELAY);
        });
    }
};
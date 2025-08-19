import React, { useState, useEffect } from 'react';
import { Farm, CoveringType } from './types';
import FarmList from './components/FarmList';
import FarmForm from './components/FarmForm';
import FarmDetails from './components/FarmDetails';

const initialFarms: Farm[] = [
    {
        id: 'farm-1',
        basicInfo: { id: 'basic-1', name: '햇살가득 농원', contact: '010-1234-5678', address: '제주특별자치도 서귀포시', areaPyeong: 2000, cultivar: '한라봉', treeCount: 500 },
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
        basicInfo: { id: 'basic-2', name: '제주오름 농장', contact: '010-9876-5432', address: '제주특별자치도 제주시', areaPyeong: 1500, cultivar: '천혜향', treeCount: 400 },
        facilityInfo: { slope: '5도', plantingDistance: '4m x 3m', hasCovering: false, hasPower: true, hasInternet: false, hasUmbrellaSystem: false, hasDripHose: true, hasSprinkler: false, hasWindbreak: true, hasOpener: false },
        supportPrograms: [],
        serviceInfo: { jacheongbiId: 'oreum_farm', jacheongbiPw: 'password123', useSugarService: false, useSensorService: false },
        annualData: [
             { id: 'ad-2', year: 2023, avgBrix: 13.8, hasAlternateBearing: true, estimatedYield: 700, pricePerGwan: 45000, shippingSeason: '2월-3월', notes: '해거리로 생산량 감소' }
        ]
    }
];

const App: React.FC = () => {
    const [farms, setFarms] = useState<Farm[]>(() => {
        const savedFarms = localStorage.getItem('citrusFarms');
        return savedFarms ? JSON.parse(savedFarms) : initialFarms;
    });

    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
    const [viewingFarm, setViewingFarm] = useState<Farm | null>(null);

    useEffect(() => {
        localStorage.setItem('citrusFarms', JSON.stringify(farms));
    }, [farms]);

    const handleAddNew = () => {
        setEditingFarm(null);
        setView('form');
    };

    const handleEdit = (farm: Farm) => {
        setEditingFarm(farm);
        setView('form');
    };

    const handleDelete = (farmId: string) => {
        setFarms(farms.filter(farm => farm.id !== farmId));
    };

    const handleSave = (farmData: Farm) => {
        const index = farms.findIndex(f => f.id === farmData.id);
        if (index > -1) {
            const updatedFarms = [...farms];
            updatedFarms[index] = farmData;
            setFarms(updatedFarms);
        } else {
            setFarms([...farms, farmData]);
        }
        setView('list');
        setEditingFarm(null);
    };

    const handleCancel = () => {
        setView('list');
        setEditingFarm(null);
    };

    const handleViewDetails = (farm: Farm) => {
        setViewingFarm(farm);
    };

    const handleCloseDetails = () => {
        setViewingFarm(null);
    };

    return (
        <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
            <header className="bg-orange-500 shadow-md">
                <div className="container mx-auto px-6 py-4">
                    <h1 className="text-3xl font-bold text-white">JEUS 감귤 농가 관리 시스템</h1>
                </div>
            </header>
            <main className="container mx-auto p-6">
                {view === 'list' && (
                    <FarmList
                        farms={farms}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onAddNew={handleAddNew}
                        onViewDetails={handleViewDetails}
                    />
                )}
                {view === 'form' && (
                    <FarmForm
                        initialData={editingFarm}
                        onSave={handleSave}
                        onCancel={handleCancel}
                    />
                )}
                {viewingFarm && (
                    <FarmDetails farm={viewingFarm} onClose={handleCloseDetails} />
                )}
            </main>
            <footer className="text-center py-4 mt-auto text-gray-500 text-sm">
                <p>&copy; {new Date().getFullYear()} Citrus Farm Management. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default App;
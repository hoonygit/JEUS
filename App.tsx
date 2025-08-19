import React, { useState, useEffect } from 'react';
import { Farm } from './types';
import FarmList from './components/FarmList';
import FarmForm from './components/FarmForm';
import FarmDetails from './components/FarmDetails';
import { farmApi } from './services/api';

const App: React.FC = () => {
    const [farms, setFarms] = useState<Farm[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
    const [viewingFarm, setViewingFarm] = useState<Farm | null>(null);

    useEffect(() => {
        const fetchFarms = async () => {
            try {
                const data = await farmApi.getAllFarms();
                setFarms(data);
            } catch (error) {
                console.error("농가 데이터를 불러오는데 실패했습니다.", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFarms();
    }, []);

    const handleAddNew = () => {
        setEditingFarm(null);
        setView('form');
    };

    const handleEdit = (farm: Farm) => {
        setEditingFarm(farm);
        setView('form');
    };

    const handleDelete = async (farmId: string) => {
        try {
            await farmApi.deleteFarm(farmId);
            setFarms(prevFarms => prevFarms.filter(farm => farm.id !== farmId));
        } catch (error) {
            console.error("농가 정보 삭제에 실패했습니다.", error);
        }
    };

    const handleSave = async (farmData: Farm) => {
        try {
            setIsLoading(true);
            const savedFarm = await farmApi.saveFarm(farmData);
            setFarms(currentFarms => {
                const isUpdate = currentFarms.some(f => f.id === savedFarm.id);
                if (isUpdate) {
                    return currentFarms.map(farm => farm.id === savedFarm.id ? savedFarm : farm);
                } else {
                    return [...currentFarms, savedFarm];
                }
            });
        } catch (error) {
            console.error("농가 정보 저장에 실패했습니다.", error);
        } finally {
            setView('list');
            setEditingFarm(null);
            setIsLoading(false);
        }
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

    const handleBackup = async () => {
        try {
            const currentFarms = await farmApi.getAllFarms();
            const jsonString = JSON.stringify(currentFarms, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const date = new Date().toISOString().slice(0, 10);
            a.href = url;
            a.download = `back_${date}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("데이터 백업에 실패했습니다.", error);
            alert("데이터 백업 중 오류가 발생했습니다.");
        }
    };

    const handleRestore = (file: File) => {
        if (!file) return;
        
        const confirmation = window.confirm("데이터를 복원하시겠습니까? 현재 모든 데이터가 선택한 파일의 내용으로 대체됩니다. 이 작업은 되돌릴 수 없습니다.");
        if (!confirmation) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const content = event.target?.result;
                if (typeof content !== 'string') throw new Error("파일을 읽을 수 없습니다.");
                
                const restoredFarms: Farm[] = JSON.parse(content);
                
                if (!Array.isArray(restoredFarms)) {
                    throw new Error("JSON 파일의 형식이 올바르지 않습니다. 최상위 요소는 배열이어야 합니다.");
                }

                setIsLoading(true);
                await farmApi.replaceAllFarms(restoredFarms);
                const updatedFarms = await farmApi.getAllFarms();
                setFarms(updatedFarms);
                alert("데이터 복원이 완료되었습니다.");

            } catch (error) {
                console.error("데이터 복원에 실패했습니다.", error);
                alert(`데이터 복원 중 오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
                setIsLoading(false);
            }
        };
        reader.onerror = () => {
             alert("파일을 읽는 중 오류가 발생했습니다.");
        }
        reader.readAsText(file);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-orange-500 mx-auto"></div>
                    <p className="text-xl text-gray-700 mt-4">데이터를 불러오는 중입니다...</p>
                </div>
            </div>
        );
    }

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
                        onBackup={handleBackup}
                        onRestore={handleRestore}
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
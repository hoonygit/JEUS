import React, { useState, useEffect } from 'react';
import { Farm } from './types';
import FarmList from './components/FarmList';
import FarmForm, { BLANK_FARM } from './components/FarmForm';
import FarmDetails from './components/FarmDetails';
import { farmApi } from './services/api';
import { XIcon } from './components/icons';

// Fix: Add type definitions for File System Access API to prevent "not callable" error.
// These types are for modern browsers that support window.showSaveFilePicker.
interface FileSystemFileHandle {
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: Blob): Promise<void>;
}

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: {
    description?: string;
    accept?: Record<string, string[]>;
  }[];
}

declare global {
  interface Window {
    showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
  }
}

interface PreCheckModalProps {
  onCheck: (searchTerm: string) => void;
  onCancel: () => void;
}

const PreCheckModal: React.FC<PreCheckModalProps> = ({ onCheck, onCancel }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCheck(searchTerm);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">신규 농가 등록 확인</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-800">
            <XIcon />
          </button>
        </div>
        <p className="text-gray-600 mb-4">
          등록하려는 농가의 이름 또는 연락처를 입력하여 기존 데이터가 있는지 확인해주세요.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col mb-6">
            <label htmlFor="pre-check-search" className="mb-2 font-medium text-gray-700">
              농가명 또는 연락처
            </label>
            <input
              id="pre-check-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="예: 햇살가득 농원 또는 010-1234-5678"
              autoFocus
            />
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition font-semibold"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition font-semibold"
            >
              확인 및 계속
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DuplicateSelectionModalProps {
  farms: Farm[];
  searchTerm: string;
  onSelect: (farm: Farm) => void;
  onCreateNew: () => void;
  onCancel: () => void;
}

const DuplicateSelectionModal: React.FC<DuplicateSelectionModalProps> = ({ farms, searchTerm, onSelect, onCreateNew, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-2xl m-4 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">유사한 농가 정보 발견</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-800">
            <XIcon />
          </button>
        </div>
        <p className="text-gray-600 mb-6">
          '<strong className="text-orange-600">{searchTerm}</strong>'(으)로 검색한 결과, {farms.length}개의 유사한 농가 정보가 있습니다. 기존 정보를 선택하여 수정하거나 새 농가로 등록해주세요.
        </p>
        
        <div className="flex-grow overflow-y-auto border rounded-md mb-6 max-h-64">
          <ul className="divide-y divide-gray-200">
            {farms.map(farm => (
              <li key={farm.id}>
                <button 
                  onClick={() => onSelect(farm)}
                  className="w-full text-left p-4 hover:bg-orange-50 transition duration-150"
                  aria-label={`${farm.basicInfo.name} 농가 선택`}
                >
                  <p className="font-semibold text-gray-800">{farm.basicInfo.name}</p>
                  <p className="text-sm text-gray-500">{farm.basicInfo.contact} / {farm.basicInfo.address}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition font-semibold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onCreateNew}
            className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition font-semibold"
          >
            새 농가로 등록하기
          </button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
    const [farms, setFarms] = useState<Farm[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
    const [viewingFarm, setViewingFarm] = useState<Farm | null>(null);
    const [showPreCheckModal, setShowPreCheckModal] = useState(false);
    const [duplicateFarms, setDuplicateFarms] = useState<Farm[]>([]);
    const [showDuplicateSelectionModal, setShowDuplicateSelectionModal] = useState(false);
    const [preCheckSearchTerm, setPreCheckSearchTerm] = useState('');


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
        setShowPreCheckModal(true);
    };
    
    const createNewFarmFromSearch = (searchTerm: string) => {
        const newFarmBase = JSON.parse(JSON.stringify(BLANK_FARM));
        const isPhoneNumber = /^\d[\d-]*$/.test(searchTerm);

        const newFarmData: Farm = {
            ...newFarmBase,
            id: crypto.randomUUID(),
            basicInfo: {
                ...newFarmBase.basicInfo,
                name: isPhoneNumber ? '' : searchTerm,
                contact: isPhoneNumber ? searchTerm : '',
            }
        };
        setEditingFarm(newFarmData);
        setView('form');
    };

    const handlePreCheck = (searchTerm: string) => {
        setShowPreCheckModal(false);
        
        const trimmedSearch = searchTerm.trim();
        if (!trimmedSearch) {
            setEditingFarm(null);
            setView('form');
            return;
        }

        const searchTermLower = trimmedSearch.toLowerCase();
        const cleanedSearchTerm = trimmedSearch.replace(/-/g, '');

        const foundFarms = farms.filter(farm =>
            farm.basicInfo.name.toLowerCase().includes(searchTermLower) ||
            (cleanedSearchTerm.length > 0 && farm.basicInfo.contact.replace(/-/g, '').includes(cleanedSearchTerm))
        );

        if (foundFarms.length === 0) {
            createNewFarmFromSearch(trimmedSearch);
        } else {
            setPreCheckSearchTerm(trimmedSearch);
            setDuplicateFarms(foundFarms);
            setShowDuplicateSelectionModal(true);
        }
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
            const date = new Date().toISOString().slice(0, 10);
            const fileName = `jeus_farm_backup_${date}.json`;

            const canUsePicker = 'showSaveFilePicker' in window && window.self === window.top;

            if (canUsePicker) {
                try {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: fileName,
                        types: [{
                            description: 'JSON Files',
                            accept: { 'application/json': ['.json'] },
                        }],
                    });
                    const writable = await handle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                    return;
                } catch (err: any) {
                    if (err.name === 'AbortError') {
                        console.log('File save cancelled by user.');
                        return;
                    }
                    console.warn("showSaveFilePicker failed, falling back to legacy download.", err);
                }
            }

            console.log("Using legacy download method.");
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-lg text-gray-600 mt-4 font-semibold">데이터를 불러오는 중입니다...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 text-gray-900 font-sans flex flex-col">
            <header className="bg-white shadow-md sticky top-0 z-10">
                <div className="container mx-auto px-6 py-4">
                    <h1 className="text-3xl font-bold text-gray-800">JEUS 농가관리 데이터베이스</h1>
                    <p className="text-sm text-gray-500 mt-1">감귤 농가의 모든 정보를 체계적으로 관리하세요.</p>
                </div>
            </header>
            <main className="container mx-auto p-6 flex-grow">
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
                {showPreCheckModal && (
                    <PreCheckModal
                        onCheck={handlePreCheck}
                        onCancel={() => setShowPreCheckModal(false)}
                    />
                )}
                {showDuplicateSelectionModal && (
                    <DuplicateSelectionModal
                        farms={duplicateFarms}
                        searchTerm={preCheckSearchTerm}
                        onSelect={(farm) => {
                            setShowDuplicateSelectionModal(false);
                            handleEdit(farm);
                        }}
                        onCreateNew={() => {
                            setShowDuplicateSelectionModal(false);
                            createNewFarmFromSearch(preCheckSearchTerm);
                        }}
                        onCancel={() => setShowDuplicateSelectionModal(false)}
                    />
                )}
            </main>
            <footer className="text-center py-4 text-gray-500 text-sm">
                <p>&copy; {new Date().getFullYear()} JEUS Farm Management System. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default App;
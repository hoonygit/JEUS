import React, { useState, useCallback } from 'react';
import { Farm, Plot, CoveringType, SupportProgram, AnnualData, CorporateFarmDetails, ConsultationLog, ConsultationCategory, PredefinedProjectName, FacilityInfo, ServiceInfo, CultivationType } from '../types';
import { PlusIcon, TrashIcon, XIcon, PencilIcon } from './icons';

interface FarmFormProps {
  initialData?: Farm | null;
  onSave: (farmData: Farm) => void;
  onCancel: () => void;
}

export const BLANK_PLOT: Omit<Plot, 'id'> = {
    address: '',
    areaPyeong: 0,
    cultivar: '',
    treeCount: 0,
    isCorporate: false,
    cultivationType: CultivationType.OPEN_FIELD,
    facilityInfo: { slope: '', plantingDistance: '', hasCovering: false, coveringType: '', hasPower: false, hasInternet: false, hasUmbrellaSystem: false, hasDripHose: false, hasSprinkler: false, hasWindbreak: false, hasOpener: false },
    serviceInfo: { jacheongbiId: '', jacheongbiPw: '', useSugarService: false, sugarMeterInfo: '', useSensorService: false, sensorInfo: '' },
    annualData: [],
    consultationLogs: [],
    supportPrograms: [],
};

export const BLANK_FARM: Omit<Farm, 'id'> = {
  name: '',
  contact: '',
  plots: [],
};

type BooleanKeys<T> = { [K in keyof T]: T[K] extends boolean ? K : never }[keyof T];

const formatPhoneNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3,4})(\d{4})$/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return value;
};

const FarmForm: React.FC<FarmFormProps> = ({ initialData, onSave, onCancel }) => {
  const [farmData, setFarmData] = useState<Farm>(
    initialData ? JSON.parse(JSON.stringify(initialData)) : { ...JSON.parse(JSON.stringify(BLANK_FARM)), id: crypto.randomUUID() }
  );
  const [editingPlot, setEditingPlot] = useState<Plot | null>(null);
  const isEditing = !!initialData;

  const handleFarmChange = useCallback(<K extends keyof Farm>(field: K, value: Farm[K]) => {
      setFarmData(prev => ({ ...prev, [field]: value }));
  }, []);
  
  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const cleaned = value.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 3 && cleaned.length <= 7) {
        formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else if (cleaned.length > 7) {
        formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
    }
    handleFarmChange('contact', formatted);
};


  const handleSavePlot = useCallback((plotData: Plot) => {
      const index = farmData.plots.findIndex(p => p.id === plotData.id);
      if (index > -1) {
          setFarmData(prev => ({ ...prev, plots: prev.plots.map(p => p.id === plotData.id ? plotData : p) }));
      } else {
          setFarmData(prev => ({ ...prev, plots: [...prev.plots, plotData] }));
      }
      setEditingPlot(null);
  }, [farmData.plots]);

  const removePlot = useCallback((plotId: string) => {
      if (window.confirm("이 필지 정보를 정말 삭제하시겠습니까?")) {
        setFarmData(prev => ({ ...prev, plots: prev.plots.filter(p => p.id !== plotId) }));
      }
  }, []);


  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!farmData.name) {
      alert("농가명은 필수 항목입니다.");
      return;
    }
    if (farmData.plots.length === 0) {
        alert("최소 하나 이상의 필지 정보를 추가해야 합니다.");
        return;
    }
    onSave({ ...farmData, contact: formatPhoneNumber(farmData.contact) });
  }, [farmData, onSave]);

  const renderInput = (label: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void, type = 'text', required = false) => (
    <div className="flex flex-col">
      <label className="mb-1 font-medium text-gray-600">{label}{required && <span className="text-red-500">*</span>}</label>
      { type === 'textarea' ? (
        <textarea value={value} onChange={onChange as (e: React.ChangeEvent<HTMLTextAreaElement>) => void} required={required} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[40px]"></textarea>
      ) : (
        <input type={type} value={value} onChange={onChange as (e: React.ChangeEvent<HTMLInputElement>) => void} required={required} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
      )}
    </div>
  );

  if (editingPlot) {
      return <PlotForm 
                initialPlotData={editingPlot}
                onSave={handleSavePlot}
                onCancel={() => setEditingPlot(null)}
             />
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-10 overflow-auto z-40">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-5xl m-4 flex flex-col max-h-[95vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{isEditing ? '농가 정보 수정' : '신규 농가 등록'}</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-800">
            <XIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
            <fieldset className="p-4 border rounded-md mb-6">
                <legend className="text-xl font-semibold text-gray-700 px-2">기본 농가 정보</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderInput('농가명', farmData.name, (e) => handleFarmChange('name', e.target.value), 'text', true)}
                    {renderInput('연락처', farmData.contact, handleContactChange, 'tel')}
                </div>
            </fieldset>
            
            <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-8 min-h-0">
                <fieldset className="p-4 border rounded-md">
                    <legend className="text-xl font-semibold text-gray-700 px-2">필지 목록 관리</legend>
                    <div className="space-y-4">
                        {farmData.plots.length > 0 ? (
                            farmData.plots.map(plot => (
                                <div key={plot.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-md border">
                                    <div>
                                        <p className="font-semibold text-gray-800">{plot.address || '주소 미입력'}</p>
                                        <p className="text-sm text-gray-600">면적: {plot.areaPyeong.toLocaleString()}평, 품종: {plot.cultivar || '-'}, {plot.isCorporate ? '기업농' : '일반농'}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button type="button" onClick={() => setEditingPlot(plot)} className="p-2 text-blue-600 hover:text-blue-800"><PencilIcon/></button>
                                        <button type="button" onClick={() => removePlot(plot.id)} className="p-2 text-red-600 hover:text-red-800"><TrashIcon/></button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 py-4">등록된 필지가 없습니다. 아래 버튼을 눌러 추가해주세요.</p>
                        )}
                    </div>
                    <button type="button" onClick={() => setEditingPlot({ ...JSON.parse(JSON.stringify(BLANK_PLOT)), id: crypto.randomUUID() })} className="mt-4 flex items-center text-orange-600 hover:text-orange-800 font-semibold">
                        <PlusIcon /><span className="ml-1">신규 필지 추가</span>
                    </button>
                </fieldset>
            </div>
            
            <div className="flex justify-end space-x-4 pt-6 mt-auto border-t">
                <button type="button" onClick={onCancel} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold">취소</button>
                <button type="submit" className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 font-semibold">저장</button>
            </div>
        </form>
      </div>
    </div>
  );
};

// --- PlotForm Component ---
interface PlotFormProps {
    initialPlotData: Plot;
    onSave: (plotData: Plot) => void;
    onCancel: () => void;
}

type PlotTab = 'basic' | 'service' | 'support' | 'corporate' | 'annual';

const PlotForm: React.FC<PlotFormProps> = ({ initialPlotData, onSave, onCancel }) => {
    const [plotData, setPlotData] = useState<Plot>(initialPlotData);
    const [activeTab, setActiveTab] = useState<PlotTab>('basic');

    const handleChange = useCallback(<K extends keyof Plot>(field: K, value: Plot[K]) => {
        setPlotData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleIsCorporateChange = useCallback((checked: boolean) => {
        setPlotData(prev => {
            const newPlotData = { ...prev, isCorporate: checked };
            if (checked) {
                if (!newPlotData.corporateFarmDetails) {
                    newPlotData.corporateFarmDetails = {
                        year: new Date().getFullYear(), consultationDate: '', estimatedQuantity: 0,
                        contractedQuantity: 0, isContracted: false, specialNotes: '',
                    };
                }
            } else {
                delete newPlotData.corporateFarmDetails;
            }
            return newPlotData;
        });
    }, []);
    
    const handleCorporateDetailsChange = useCallback(<K extends keyof CorporateFarmDetails>(field: K, value: CorporateFarmDetails[K]) => {
        setPlotData(prev => ({
            ...prev, corporateFarmDetails: { ...prev.corporateFarmDetails!, [field]: value },
        }));
    }, []);

    const handleIsContractedChange = useCallback((checked: boolean) => {
        setPlotData(prev => {
            const currentDetails = { ...prev.corporateFarmDetails! };
            currentDetails.isContracted = checked;
            if (!checked) {
                delete currentDetails.contractDate; delete currentDetails.downPayment;
                delete currentDetails.balanceDueDate; delete currentDetails.balancePayment;
                delete currentDetails.mulchingWorkDate;
            }
            return { ...prev, corporateFarmDetails: currentDetails };
        });
    }, []);

    const handleFacilityChange = useCallback(<K extends keyof FacilityInfo>(field: K, value: FacilityInfo[K]) => {
        setPlotData(prev => ({ ...prev, facilityInfo: { ...prev.facilityInfo, [field]: value } }));
    }, []);

    const handleServiceInfoChange = useCallback(<K extends keyof ServiceInfo>(field: K, value: ServiceInfo[K]) => {
        setPlotData(prev => ({
          ...prev,
          serviceInfo: { ...prev.serviceInfo, [field]: value }
        }));
    }, []);
      
    const handleServiceCheckboxChange = useCallback((field: BooleanKeys<ServiceInfo>, checked: boolean) => {
        setPlotData(prev => ({
          ...prev,
          serviceInfo: { ...prev.serviceInfo, [field]: checked }
        }));
    }, []);
    
    const addSupportProgram = useCallback(() => {
        const newProgram: SupportProgram = { id: crypto.randomUUID(), year: new Date().getFullYear(), projectName: PredefinedProjectName.VARIETY_RENEWAL, projectDescription: '', localGovtFund: 0, selfFund: 0, isSelected: false };
        setPlotData(prev => ({ ...prev, supportPrograms: [...prev.supportPrograms, newProgram] }));
    }, []);

    const updateSupportProgram = useCallback(<K extends keyof SupportProgram>(index: number, field: K, value: SupportProgram[K]) => {
        setPlotData(prev => ({ ...prev, supportPrograms: prev.supportPrograms.map((p, i) => i === index ? { ...p, [field]: value } : p) }));
    }, []);

    const removeSupportProgram = useCallback((index: number) => {
        setPlotData(prev => ({ ...prev, supportPrograms: prev.supportPrograms.filter((_, i) => i !== index) }));
    }, []);

    const addAnnualData = useCallback(() => {
        const newData: AnnualData = { id: crypto.randomUUID(), year: new Date().getFullYear(), avgBrix: 0, hasAlternateBearing: false, estimatedYield: 0, pricePerGwan: 0, shippingSeason: '', notes: '' };
        setPlotData(prev => ({ ...prev, annualData: [...prev.annualData, newData] }));
    }, []);

    const updateAnnualData = useCallback(<K extends keyof AnnualData>(index: number, field: K, value: AnnualData[K]) => {
        setPlotData(prev => ({ ...prev, annualData: prev.annualData.map((d, i) => i === index ? { ...d, [field]: value } : d) }));
    }, []);
    
    const removeAnnualData = useCallback((index: number) => {
        setPlotData(prev => ({ ...prev, annualData: prev.annualData.filter((_, i) => i !== index) }));
    }, []);

    const addConsultationLog = useCallback(() => {
        const newLog: ConsultationLog = { id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), category: '', content: '', notes: '' };
        setPlotData(prev => ({ ...prev, consultationLogs: [...prev.consultationLogs, newLog]}));
    }, []);

    const updateConsultationLog = useCallback(<K extends keyof ConsultationLog>(index: number, field: K, value: ConsultationLog[K]) => {
        setPlotData(prev => ({ ...prev, consultationLogs: prev.consultationLogs.map((log, i) => i === index ? { ...log, [field]: value } : log) }));
    }, []);

    const removeConsultationLog = useCallback((index: number) => {
        setPlotData(prev => ({ ...prev, consultationLogs: prev.consultationLogs.filter((_, i) => i !== index) }));
    }, []);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!plotData.address) {
            alert("필지 주소는 필수 항목입니다.");
            setActiveTab('basic');
            return;
        }
        onSave(plotData);
    }, [plotData, onSave]);
    
    const renderInput = (label: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void, type = 'text', required = false) => (
        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-600">{label}{required && <span className="text-red-500">*</span>}</label>
          { type === 'textarea' ? (
            <textarea value={value} onChange={onChange as (e: React.ChangeEvent<HTMLTextAreaElement>) => void} required={required} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[40px]"></textarea>
          ) : (
            <input type={type} value={value} onChange={onChange as (e: React.ChangeEvent<HTMLInputElement>) => void} required={required} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
          )}
        </div>
      );
      
      const renderCheckbox = (label: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void) => (
        <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-100">
          <input type="checkbox" checked={checked} onChange={onChange} className="h-5 w-5 rounded text-orange-600 focus:ring-orange-500 border-gray-300"/>
          <span className="text-gray-700 font-medium">{label}</span>
        </label>
      );

    const TabButton: React.FC<{tab: PlotTab, children: React.ReactNode}> = ({ tab, children }) => (
        <button type="button" onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors duration-200 focus:outline-none ${activeTab === tab ? 'border-b-2 border-orange-500 text-orange-600' : 'text-gray-500 hover:text-orange-500'}`} role="tab" aria-selected={activeTab === tab}>
            {children}
        </button>
    );
      
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-start pt-10 overflow-auto z-50">
          <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-6xl m-4 flex flex-col max-h-[95vh]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">필지 정보 관리</h2>
              <button onClick={onCancel} className="text-gray-500 hover:text-gray-800"><XIcon /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex-grow flex flex-col min-h-0">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6" role="tablist">
                       <TabButton tab="basic">기본/시설</TabButton>
                       <TabButton tab="service">서비스</TabButton>
                       <TabButton tab="corporate">기업농/상담</TabButton>
                       <TabButton tab="support">지원사업</TabButton>
                       <TabButton tab="annual">연간 데이터</TabButton>
                    </nav>
                </div>

                <div className="flex-grow overflow-y-auto pt-6 pr-2 -mr-4 space-y-8 min-h-0">
                {activeTab === 'basic' && (
                    <div role="tabpanel" className="space-y-6">
                        <fieldset className="p-4 border rounded-md">
                            <legend className="text-lg font-semibold text-gray-700 px-2">필지 정보</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {renderInput('주소', plotData.address, e => handleChange('address', e.target.value), 'text', true)}
                                {renderInput('면적(평)', plotData.areaPyeong, e => handleChange('areaPyeong', parseInt(e.target.value) || 0), 'number')}
                                {renderInput('품종', plotData.cultivar, e => handleChange('cultivar', e.target.value))}
                                {renderInput('과수본수', plotData.treeCount, e => handleChange('treeCount', parseInt(e.target.value) || 0), 'number')}
                            </div>
                             <div className="mt-4">
                                <label className="mb-1 font-medium text-gray-600 block">재배 형태</label>
                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-100">
                                        <input type="radio" name={`cultivationType-${plotData.id}`} value={CultivationType.OPEN_FIELD} checked={plotData.cultivationType === CultivationType.OPEN_FIELD} onChange={e => handleChange('cultivationType', e.target.value as CultivationType)} className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300" />
                                        <span className="text-gray-700 font-medium">{CultivationType.OPEN_FIELD}</span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-100">
                                        <input type="radio" name={`cultivationType-${plotData.id}`} value={CultivationType.GREENHOUSE} checked={plotData.cultivationType === CultivationType.GREENHOUSE} onChange={e => handleChange('cultivationType', e.target.value as CultivationType)} className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300" />
                                        <span className="text-gray-700 font-medium">{CultivationType.GREENHOUSE}</span>
                                    </label>
                                </div>
                            </div>
                        </fieldset>
                        <fieldset className="p-4 border rounded-md">
                            <legend className="text-lg font-semibold text-gray-700 px-2">시설 정보</legend>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                {renderInput('경사도', plotData.facilityInfo.slope, e => handleFacilityChange('slope', e.target.value))}
                                {renderInput('식재간격/원지정비', plotData.facilityInfo.plantingDistance, e => handleFacilityChange('plantingDistance', e.target.value))}
                                <div className="flex items-end">
                                    {renderCheckbox('피복', plotData.facilityInfo.hasCovering, e => handleFacilityChange('hasCovering', e.target.checked))}
                                    {plotData.facilityInfo.hasCovering && (
                                        <select value={plotData.facilityInfo.coveringType} onChange={e => handleFacilityChange('coveringType', e.target.value as CoveringType)} className="ml-4 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
                                            <option value="">종류 선택</option>
                                            {Object.values(CoveringType).map(type => <option key={type} value={type}>{type}</option>)}
                                        </select>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {renderCheckbox('전원', plotData.facilityInfo.hasPower, e => handleFacilityChange('hasPower', e.target.checked))}
                                {renderCheckbox('인터넷', plotData.facilityInfo.hasInternet, e => handleFacilityChange('hasInternet', e.target.checked))}
                                {renderCheckbox('우산식', plotData.facilityInfo.hasUmbrellaSystem, e => handleFacilityChange('hasUmbrellaSystem', e.target.checked))}
                                {renderCheckbox('점적호스', plotData.facilityInfo.hasDripHose, e => handleFacilityChange('hasDripHose', e.target.checked))}
                                {renderCheckbox('스프링쿨러', plotData.facilityInfo.hasSprinkler, e => handleFacilityChange('hasSprinkler', e.target.checked))}
                                {renderCheckbox('방풍망', plotData.facilityInfo.hasWindbreak, e => handleFacilityChange('hasWindbreak', e.target.checked))}
                                {renderCheckbox('개폐기', plotData.facilityInfo.hasOpener, e => handleFacilityChange('hasOpener', e.target.checked))}
                            </div>
                        </fieldset>
                    </div>
                )}
                {activeTab === 'service' && (
                     <div role="tabpanel">
                         <fieldset className="p-4 border rounded-md">
                            <legend className="text-lg font-semibold text-gray-700 px-2">서비스 정보</legend>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderInput('자청비 ID', plotData.serviceInfo.jacheongbiId, e => handleServiceInfoChange('jacheongbiId', e.target.value))}
                                {renderInput('자청비 PW', plotData.serviceInfo.jacheongbiPw, e => handleServiceInfoChange('jacheongbiPw', e.target.value))}
                                <div className="flex items-center">
                                    {renderCheckbox('당도 서비스 사용', plotData.serviceInfo.useSugarService, e => handleServiceCheckboxChange('useSugarService', e.target.checked))}
                                    {plotData.serviceInfo.useSugarService && (
                                        <input type="text" placeholder="당도계 정보" value={plotData.serviceInfo.sugarMeterInfo} onChange={e => handleServiceInfoChange('sugarMeterInfo', e.target.value)} className="ml-4 flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                                    )}
                                </div>
                                <div className="flex items-center">
                                    {renderCheckbox('센서 서비스 사용', plotData.serviceInfo.useSensorService, e => handleServiceCheckboxChange('useSensorService', e.target.checked))}
                                    {plotData.serviceInfo.useSensorService && (
                                        <input type="text" placeholder="센서 정보" value={plotData.serviceInfo.sensorInfo} onChange={e => handleServiceInfoChange('sensorInfo', e.target.value)} className="ml-4 flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                                    )}
                                </div>
                             </div>
                         </fieldset>
                     </div>
                )}
                {activeTab === 'corporate' && (
                    <div role="tabpanel" className="space-y-6">
                        <fieldset className="p-4 border rounded-md">
                             <legend className="text-lg font-semibold text-gray-700 px-2">기업농 관리</legend>
                             {renderCheckbox('기업농', plotData.isCorporate, e => handleIsCorporateChange(e.target.checked))}
                        </fieldset>

                        {plotData.isCorporate && (
                            <>
                            <fieldset className="p-4 border rounded-md">
                                <legend className="text-lg font-semibold text-gray-700 px-2">기업농 계약 정보</legend>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {renderInput('상담년도', plotData.corporateFarmDetails?.year || new Date().getFullYear(), e => handleCorporateDetailsChange('year', parseInt(e.target.value) || 0), 'number')}
                                    {renderInput('상담일', plotData.corporateFarmDetails?.consultationDate || '', e => handleCorporateDetailsChange('consultationDate', e.target.value), 'date')}
                                    {renderInput('예상관수', plotData.corporateFarmDetails?.estimatedQuantity || 0, e => handleCorporateDetailsChange('estimatedQuantity', parseInt(e.target.value) || 0), 'number')}
                                    {renderInput('계약관수', plotData.corporateFarmDetails?.contractedQuantity || 0, e => handleCorporateDetailsChange('contractedQuantity', parseInt(e.target.value) || 0), 'number')}
                                </div>
                                <div className="mt-4">
                                    {renderInput('특이사항', plotData.corporateFarmDetails?.specialNotes || '', e => handleCorporateDetailsChange('specialNotes', e.target.value), 'textarea')}
                                </div>
                                <div className="mt-4">
                                    {renderCheckbox('계약완료', plotData.corporateFarmDetails?.isContracted || false, e => handleIsContractedChange(e.target.checked))}
                                </div>
                                {plotData.corporateFarmDetails?.isContracted && (
                                    <div className="mt-4 p-4 border rounded-md bg-gray-50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {renderInput('계약일', plotData.corporateFarmDetails?.contractDate || '', e => handleCorporateDetailsChange('contractDate', e.target.value), 'date')}
                                        {renderInput('계약금(원)', plotData.corporateFarmDetails?.downPayment || 0, e => handleCorporateDetailsChange('downPayment', parseInt(e.target.value) || 0), 'number')}
                                        {renderInput('잔금일', plotData.corporateFarmDetails?.balanceDueDate || '', e => handleCorporateDetailsChange('balanceDueDate', e.target.value), 'date')}
                                        {renderInput('잔금(원)', plotData.corporateFarmDetails?.balancePayment || 0, e => handleCorporateDetailsChange('balancePayment', parseInt(e.target.value) || 0), 'number')}
                                        {renderInput('멀칭작업일', plotData.corporateFarmDetails?.mulchingWorkDate || '', e => handleCorporateDetailsChange('mulchingWorkDate', e.target.value), 'date')}
                                    </div>
                                )}
                            </fieldset>

                            <fieldset className="p-4 border rounded-md">
                                <legend className="text-lg font-semibold text-gray-700 px-2">상담 일지</legend>
                                <div className="space-y-4">
                                    {plotData.consultationLogs.map((log, index) => (
                                        <div key={log.id} className="p-4 border rounded-lg bg-gray-50 relative space-y-4">
                                            <div className="flex flex-col sm:flex-row gap-4">
                                                <div className="flex-1">
                                                    <label className="text-sm font-medium text-gray-600 block mb-1">상담 날짜</label>
                                                    <input type="date" value={log.date} onChange={e => updateConsultationLog(index, 'date', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-sm font-medium text-gray-600 block mb-1">상담 구분</label>
                                                    <select value={log.category} onChange={e => updateConsultationLog(index, 'category', e.target.value as ConsultationCategory)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                                                        <option value="">구분 선택</option>
                                                        {Object.values(ConsultationCategory).map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                 <label className="text-sm font-medium text-gray-600 block mb-1">상담 내용</label>
                                                 <textarea placeholder="상담 내용을 입력하세요" value={log.content} onChange={e => updateConsultationLog(index, 'content', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[60px] focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-600 block mb-1">비고</label>
                                                <textarea placeholder="비고를 입력하세요" value={log.notes} onChange={e => updateConsultationLog(index, 'notes', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[40px] focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                            </div>
                                            <button type="button" onClick={() => removeConsultationLog(index)} className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700" aria-label="상담일지 삭제"><TrashIcon/></button>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={addConsultationLog} className="mt-4 flex items-center text-orange-600 hover:text-orange-800 font-semibold"><PlusIcon/><span className="ml-1">상담일지 추가</span></button>
                            </fieldset>
                            </>
                        )}
                    </div>
                )}
                {activeTab === 'support' && (
                    <div role="tabpanel">
                         <fieldset className="p-4 border rounded-md">
                            <legend className="text-lg font-semibold text-gray-700 px-2">지원 사업</legend>
                            <div className="space-y-3">
                                {plotData.supportPrograms.map((program, index) => (
                                    <div key={program.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start p-3 border rounded-md bg-gray-50">
                                        <input type="number" placeholder="년도" value={program.year} onChange={e => updateSupportProgram(index, 'year', parseInt(e.target.value) || 0)} className="col-span-12 md:col-span-1 px-2 py-1 border rounded"/>
                                        <select value={program.projectName} onChange={e => updateSupportProgram(index, 'projectName', e.target.value)} className="col-span-12 md:col-span-2 px-2 py-1 border rounded">
                                            {Object.values(PredefinedProjectName).map(name => <option key={name} value={name}>{name}</option>)}
                                        </select>
                                        <textarea placeholder="사업 내용" value={program.projectDescription} onChange={e => updateSupportProgram(index, 'projectDescription', e.target.value)} className="col-span-12 md:col-span-3 px-2 py-1 border rounded"/>
                                        
                                        <div className="col-span-12 md:col-span-2">
                                            <label htmlFor={`localGovtFund-${index}`} className="text-xs font-medium text-gray-600 block mb-1">지원금(원)</label>
                                            <input id={`localGovtFund-${index}`} type="number" placeholder="지원금" value={program.localGovtFund} onChange={e => updateSupportProgram(index, 'localGovtFund', parseInt(e.target.value) || 0)} className="w-full px-2 py-1 border rounded"/>
                                        </div>
                                        
                                        <div className="col-span-12 md:col-span-2">
                                            <label htmlFor={`selfFund-${index}`} className="text-xs font-medium text-gray-600 block mb-1">자부담(원)</label>
                                            <input id={`selfFund-${index}`} type="number" placeholder="자부담" value={program.selfFund} onChange={e => updateSupportProgram(index, 'selfFund', parseInt(e.target.value) || 0)} className="w-full px-2 py-1 border rounded"/>
                                        </div>
                                        
                                        <div className="col-span-6 md:col-span-1 flex items-center justify-center pt-6">{renderCheckbox('선정', program.isSelected, e => updateSupportProgram(index, 'isSelected', e.target.checked))}</div>
                                        <button type="button" onClick={() => removeSupportProgram(index)} className="col-span-6 md:col-span-1 p-2 text-red-500 hover:text-red-700 justify-self-center self-center"><TrashIcon/></button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={addSupportProgram} className="mt-3 flex items-center text-orange-600 hover:text-orange-800"><PlusIcon/><span className="ml-1">지원사업 추가</span></button>
                        </fieldset>
                    </div>
                )}
                {activeTab === 'annual' && (
                    <div role="tabpanel">
                        <fieldset className="p-4 border rounded-md">
                            <legend className="text-lg font-semibold text-gray-700 px-2">연간 데이터</legend>
                            <div className="space-y-4">
                                {plotData.annualData.map((data, index) => {
                                    const dataId = `annual-${data.id}`;
                                    return (
                                        <div key={data.id} className="p-4 border rounded-lg bg-gray-50 relative space-y-4">
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                                <div>
                                                    <label htmlFor={`${dataId}-year`} className="text-sm font-medium text-gray-600 block mb-1">년도</label>
                                                    <input id={`${dataId}-year`} type="number" value={data.year} onChange={e => updateAnnualData(index, 'year', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                                </div>
                                                <div>
                                                    <label htmlFor={`${dataId}-avgBrix`} className="text-sm font-medium text-gray-600 block mb-1">평균당도</label>
                                                    <input id={`${dataId}-avgBrix`} type="number" step="0.1" value={data.avgBrix} onChange={e => updateAnnualData(index, 'avgBrix', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                                </div>
                                                <div>
                                                    <label htmlFor={`${dataId}-estimatedYield`} className="text-sm font-medium text-gray-600 block mb-1">예상생산량(관)</label>
                                                    <input id={`${dataId}-estimatedYield`} type="number" value={data.estimatedYield} onChange={e => updateAnnualData(index, 'estimatedYield', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                                </div>
                                                <div>
                                                    <label htmlFor={`${dataId}-pricePerGwan`} className="text-sm font-medium text-gray-600 block mb-1">관당가격(원)</label>
                                                    <input id={`${dataId}-pricePerGwan`} type="number" value={data.pricePerGwan} onChange={e => updateAnnualData(index, 'pricePerGwan', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                                </div>
                                                <div>
                                                    <label htmlFor={`${dataId}-shippingSeason`} className="text-sm font-medium text-gray-600 block mb-1">출하시기</label>
                                                    <input id={`${dataId}-shippingSeason`} type="text" value={data.shippingSeason} onChange={e => updateAnnualData(index, 'shippingSeason', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                                </div>
                                            </div>
                                            <div>
                                                <label htmlFor={`${dataId}-notes`} className="text-sm font-medium text-gray-600 block mb-1">비고</label>
                                                <textarea id={`${dataId}-notes`} value={data.notes} onChange={e => updateAnnualData(index, 'notes', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                            </div>
                                            <div className="flex justify-between items-center">
                                                {renderCheckbox('해거리', data.hasAlternateBearing, e => updateAnnualData(index, 'hasAlternateBearing', e.target.checked))}
                                                <button type="button" onClick={() => removeAnnualData(index)} className="p-2 text-red-500 hover:text-red-700" aria-label="연간 데이터 삭제"><TrashIcon/></button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <button type="button" onClick={addAnnualData} className="mt-4 flex items-center text-orange-600 hover:text-orange-800 font-semibold"><PlusIcon/><span className="ml-1">연간 데이터 추가</span></button>
                        </fieldset>
                    </div>
                )}
                </div>
                
                <div className="flex justify-end space-x-4 pt-6 mt-auto border-t">
                    <button type="button" onClick={onCancel} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold">취소</button>
                    <button type="submit" className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 font-semibold">필지 정보 저장</button>
                </div>
            </form>
          </div>
        </div>
    );
};

export default React.memo(FarmForm);

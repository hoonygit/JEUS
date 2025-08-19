
import React, { useState } from 'react';
import { Farm, CoveringType, SupportProgram, AnnualData, CorporateFarmDetails, ConsultationLog, ConsultationCategory } from '../types';
import { PlusIcon, TrashIcon, XIcon } from './icons';

interface FarmFormProps {
  initialData?: Farm | null;
  onSave: (farmData: Farm) => void;
  onCancel: () => void;
}

const BLANK_FARM: Omit<Farm, 'id' | 'corporateFarmDetails'> = {
  basicInfo: { id: '', name: '', contact: '', address: '', areaPyeong: 0, cultivar: '', treeCount: 0, isCorporate: false },
  facilityInfo: { slope: '', plantingDistance: '', hasCovering: false, coveringType: '', hasPower: false, hasInternet: false, hasUmbrellaSystem: false, hasDripHose: false, hasSprinkler: false, hasWindbreak: false, hasOpener: false },
  supportPrograms: [],
  serviceInfo: { jacheongbiId: '', jacheongbiPw: '', useSugarService: false, sugarMeterInfo: '', useSensorService: false, sensorInfo: '' },
  annualData: []
};

// 특정 객체 타입에서 boolean 값을 갖는 키들만 추출하는 유틸리티 타입
type BooleanKeys<T> = { [K in keyof T]: T[K] extends boolean ? K : never }[keyof T];

const FarmForm: React.FC<FarmFormProps> = ({ initialData, onSave, onCancel }) => {
  const [farmData, setFarmData] = useState<Farm>(
    initialData ? JSON.parse(JSON.stringify(initialData)) : { ...JSON.parse(JSON.stringify(BLANK_FARM)), id: crypto.randomUUID() }
  );
  
  const isEditing = !!initialData;

  const handleChange = <T extends 'basicInfo' | 'facilityInfo' | 'serviceInfo', K extends keyof Farm[T]>(section: T, field: K, value: Farm[T][K]) => {
    setFarmData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };
  
  const handleCheckboxChange = <T extends 'facilityInfo' | 'serviceInfo'>(section: T, field: BooleanKeys<Farm[T]>, checked: boolean) => {
    setFarmData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: checked
      }
    }));
  };

  const handleIsCorporateChange = (checked: boolean) => {
    setFarmData(prev => {
        const newBasicInfo = { ...prev.basicInfo, isCorporate: checked };
        if (checked) {
            const newCorporateDetails = prev.corporateFarmDetails || {
                year: new Date().getFullYear(),
                consultationDate: '',
                estimatedQuantity: 0,
                contractedQuantity: 0,
                isContracted: false,
                specialNotes: '',
                consultationLogs: [],
            };
            return { ...prev, basicInfo: newBasicInfo, corporateFarmDetails: newCorporateDetails };
        } else {
            const { corporateFarmDetails, ...rest } = prev;
            return { ...rest, basicInfo: newBasicInfo };
        }
    });
  };
  
  const handleCorporateDetailsChange = <K extends keyof CorporateFarmDetails>(field: K, value: CorporateFarmDetails[K]) => {
      setFarmData(prev => ({
          ...prev,
          corporateFarmDetails: {
              ...prev.corporateFarmDetails!,
              [field]: value,
          },
      }));
  };

  const handleIsContractedChange = (checked: boolean) => {
      setFarmData(prev => {
          const currentDetails = { ...prev.corporateFarmDetails! };
          currentDetails.isContracted = checked;

          if (!checked) {
              delete currentDetails.contractDate;
              delete currentDetails.downPayment;
              delete currentDetails.balanceDueDate;
              delete currentDetails.balancePayment;
              delete currentDetails.mulchingWorkDate;
          }
          return { ...prev, corporateFarmDetails: currentDetails };
      });
  };

  const addSupportProgram = () => {
    const newProgram: SupportProgram = { id: crypto.randomUUID(), year: new Date().getFullYear(), projectName: '', projectDescription: '', localGovtFund: 0, selfFund: 0, isSelected: false };
    setFarmData(prev => ({ ...prev, supportPrograms: [...prev.supportPrograms, newProgram] }));
  };

  const updateSupportProgram = <K extends keyof SupportProgram>(index: number, field: K, value: SupportProgram[K]) => {
    setFarmData(prev => ({
      ...prev,
      supportPrograms: prev.supportPrograms.map((program, i) =>
        i === index ? { ...program, [field]: value } : program
      ),
    }));
  };

  const removeSupportProgram = (index: number) => {
    setFarmData(prev => ({ ...prev, supportPrograms: prev.supportPrograms.filter((_, i) => i !== index) }));
  };

  const addAnnualData = () => {
    const newData: AnnualData = { id: crypto.randomUUID(), year: new Date().getFullYear(), avgBrix: 0, hasAlternateBearing: false, estimatedYield: 0, pricePerGwan: 0, shippingSeason: '', notes: '' };
    setFarmData(prev => ({ ...prev, annualData: [...prev.annualData, newData] }));
  };
  
  const updateAnnualData = <K extends keyof AnnualData>(index: number, field: K, value: AnnualData[K]) => {
    setFarmData(prev => ({
        ...prev,
        annualData: prev.annualData.map((data, i) => 
            i === index ? { ...data, [field]: value } : data
        ),
    }));
  };

  const removeAnnualData = (index: number) => {
    setFarmData(prev => ({ ...prev, annualData: prev.annualData.filter((_, i) => i !== index) }));
  };

  const addConsultationLog = () => {
    const newLog: ConsultationLog = { id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), category: '', content: '', notes: '' };
    setFarmData(prev => ({
        ...prev,
        corporateFarmDetails: { ...prev.corporateFarmDetails!, consultationLogs: [...prev.corporateFarmDetails!.consultationLogs, newLog] },
    }));
  };

  const updateConsultationLog = <K extends keyof ConsultationLog>(index: number, field: K, value: ConsultationLog[K]) => {
      setFarmData(prev => ({
          ...prev,
          corporateFarmDetails: {
              ...prev.corporateFarmDetails!,
              consultationLogs: prev.corporateFarmDetails!.consultationLogs.map((log, i) => i === index ? { ...log, [field]: value } : log),
          },
      }));
  };

  const removeConsultationLog = (index: number) => {
      setFarmData(prev => ({
          ...prev,
          corporateFarmDetails: {
              ...prev.corporateFarmDetails!,
              consultationLogs: prev.corporateFarmDetails!.consultationLogs.filter((_, i) => i !== index),
          },
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(farmData);
  };

  const renderInput = (label: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void, type = 'text', required = false) => (
    <div className="flex flex-col">
      <label className="mb-1 font-medium text-gray-600">{label}</label>
      { type === 'textarea' ? (
        <textarea value={value} onChange={onChange as (e: React.ChangeEvent<HTMLTextAreaElement>) => void} required={required} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[40px]"></textarea>
      ) : (
        <input type={type} value={value} onChange={onChange as (e: React.ChangeEvent<HTMLInputElement>) => void} required={required} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
      )}
    </div>
  );
  
  const renderCheckbox = (label: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void) => (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="h-5 w-5 rounded text-orange-600 focus:ring-orange-500"/>
      <span className="text-gray-700">{label}</span>
    </label>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-10 overflow-auto">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-4xl m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">{isEditing ? '농가 정보 수정' : '신규 농가 등록'}</h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-800">
            <XIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-8 max-h-[80vh] overflow-y-auto pr-4">
          
          <fieldset className="p-4 border rounded-md">
            <legend className="text-xl font-semibold text-gray-700 px-2">기본 농가 정보</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderInput('농가명', farmData.basicInfo.name, (e) => handleChange('basicInfo', 'name', e.target.value), 'text', true)}
              {renderInput('연락처', farmData.basicInfo.contact, (e) => handleChange('basicInfo', 'contact', e.target.value))}
              {renderInput('주소', farmData.basicInfo.address, (e) => handleChange('basicInfo', 'address', e.target.value))}
              {renderInput('면적(평)', farmData.basicInfo.areaPyeong, (e) => handleChange('basicInfo', 'areaPyeong', Number(e.target.value)), 'number')}
              {renderInput('품종', farmData.basicInfo.cultivar, (e) => handleChange('basicInfo', 'cultivar', e.target.value))}
              {renderInput('과수본수', farmData.basicInfo.treeCount, (e) => handleChange('basicInfo', 'treeCount', Number(e.target.value)), 'number')}
            </div>
             <div className="mt-4">
                {renderCheckbox('기업농', farmData.basicInfo.isCorporate, (e) => handleIsCorporateChange(e.target.checked))}
            </div>
          </fieldset>
          
          {farmData.basicInfo.isCorporate && farmData.corporateFarmDetails && (
              <>
              <fieldset className="p-4 border rounded-md">
                <legend className="text-xl font-semibold text-gray-700 px-2">기업농 관련 정보</legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {renderInput('년도', farmData.corporateFarmDetails.year, (e) => handleCorporateDetailsChange('year', Number(e.target.value)), 'number')}
                   {renderInput('상담일', farmData.corporateFarmDetails.consultationDate, (e) => handleCorporateDetailsChange('consultationDate', e.target.value), 'date')}
                   {renderInput('예상관수', farmData.corporateFarmDetails.estimatedQuantity, (e) => handleCorporateDetailsChange('estimatedQuantity', Number(e.target.value)), 'number')}
                   {renderInput('계약관수', farmData.corporateFarmDetails.contractedQuantity, (e) => handleCorporateDetailsChange('contractedQuantity', Number(e.target.value)), 'number')}
                   <div className="md:col-span-2">
                     {renderInput('특이사항', farmData.corporateFarmDetails.specialNotes, (e) => handleCorporateDetailsChange('specialNotes', e.target.value), 'textarea')}
                   </div>
                </div>
                 <div className="mt-4">
                    {renderCheckbox('계약 여부', farmData.corporateFarmDetails.isContracted, (e) => handleIsContractedChange(e.target.checked))}
                </div>
                {farmData.corporateFarmDetails.isContracted && (
                     <div className="mt-4 p-4 border rounded-md bg-gray-50 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderInput('계약일', farmData.corporateFarmDetails.contractDate || '', (e) => handleCorporateDetailsChange('contractDate', e.target.value), 'date')}
                        {renderInput('계약금', farmData.corporateFarmDetails.downPayment || 0, (e) => handleCorporateDetailsChange('downPayment', Number(e.target.value)), 'number')}
                        {renderInput('잔금일', farmData.corporateFarmDetails.balanceDueDate || '', (e) => handleCorporateDetailsChange('balanceDueDate', e.target.value), 'date')}
                        {renderInput('잔금', farmData.corporateFarmDetails.balancePayment || 0, (e) => handleCorporateDetailsChange('balancePayment', Number(e.target.value)), 'number')}
                        {renderInput('멀칭작업일', farmData.corporateFarmDetails.mulchingWorkDate || '', (e) => handleCorporateDetailsChange('mulchingWorkDate', e.target.value), 'date')}
                     </div>
                )}
              </fieldset>

              <fieldset className="p-4 border rounded-md">
                <legend className="text-xl font-semibold text-gray-700 px-2">상담 일지 내역</legend>
                <div className="space-y-4">
                    {farmData.corporateFarmDetails.consultationLogs.map((log, i) => (
                        <div key={log.id} className="p-3 bg-gray-50 rounded-md border grid grid-cols-1 md:grid-cols-2 gap-3 relative">
                            <button type="button" onClick={() => removeConsultationLog(i)} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><TrashIcon /></button>
                            {renderInput('날짜', log.date, (e) => updateConsultationLog(i, 'date', e.target.value), 'date')}
                            <div className="flex flex-col">
                                <label className="mb-1 font-medium text-gray-600">구분</label>
                                <select value={log.category} onChange={(e) => updateConsultationLog(i, 'category', e.target.value as ConsultationCategory)} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
                                    <option value="">선택</option>
                                    {Object.values(ConsultationCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                {renderInput('내용', log.content, (e) => updateConsultationLog(i, 'content', e.target.value), 'textarea')}
                            </div>
                            <div className="md:col-span-2">
                                {renderInput('비고', log.notes, (e) => updateConsultationLog(i, 'notes', e.target.value), 'textarea')}
                            </div>
                        </div>
                    ))}
                </div>
                 <button type="button" onClick={addConsultationLog} className="mt-4 flex items-center text-orange-600 hover:text-orange-800">
                    <PlusIcon /><span className="ml-1">상담 일지 추가</span>
                </button>
              </fieldset>
              </>
          )}

          <fieldset className="p-4 border rounded-md">
            <legend className="text-xl font-semibold text-gray-700 px-2">시설 정보</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {renderInput('경사도', farmData.facilityInfo.slope, (e) => handleChange('facilityInfo', 'slope', e.target.value))}
              {renderInput('식재간격 및 원지정비', farmData.facilityInfo.plantingDistance, (e) => handleChange('facilityInfo', 'plantingDistance', e.target.value))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {renderCheckbox('전원', farmData.facilityInfo.hasPower, (e) => handleCheckboxChange('facilityInfo', 'hasPower', e.target.checked))}
              {renderCheckbox('인터넷', farmData.facilityInfo.hasInternet, (e) => handleCheckboxChange('facilityInfo', 'hasInternet', e.target.checked))}
              {renderCheckbox('우산식', farmData.facilityInfo.hasUmbrellaSystem, (e) => handleCheckboxChange('facilityInfo', 'hasUmbrellaSystem', e.target.checked))}
              {renderCheckbox('점적호스', farmData.facilityInfo.hasDripHose, (e) => handleCheckboxChange('facilityInfo', 'hasDripHose', e.target.checked))}
              {renderCheckbox('스프링쿨러', farmData.facilityInfo.hasSprinkler, (e) => handleCheckboxChange('facilityInfo', 'hasSprinkler', e.target.checked))}
              {renderCheckbox('방풍망', farmData.facilityInfo.hasWindbreak, (e) => handleCheckboxChange('facilityInfo', 'hasWindbreak', e.target.checked))}
              {renderCheckbox('개폐기', farmData.facilityInfo.hasOpener, (e) => handleCheckboxChange('facilityInfo', 'hasOpener', e.target.checked))}
            </div>
            <div className="mt-4 flex items-center space-x-4">
                {renderCheckbox('피복', farmData.facilityInfo.hasCovering, (e) => handleCheckboxChange('facilityInfo', 'hasCovering', e.target.checked))}
                {farmData.facilityInfo.hasCovering && (
                    <select value={farmData.facilityInfo.coveringType} onChange={(e) => handleChange('facilityInfo', 'coveringType', e.target.value as CoveringType | '')} className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
                        <option value="">종류 선택</option>
                        {Object.values(CoveringType).map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                )}
            </div>
          </fieldset>

          <fieldset className="p-4 border rounded-md">
            <legend className="text-xl font-semibold text-gray-700 px-2">사용 서비스 정보</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderInput('자청비 ID', farmData.serviceInfo.jacheongbiId, (e) => handleChange('serviceInfo', 'jacheongbiId', e.target.value))}
              {renderInput('자청비 패스워드', farmData.serviceInfo.jacheongbiPw, (e) => handleChange('serviceInfo', 'jacheongbiPw', e.target.value), 'password')}
            </div>
            <div className="mt-4 space-y-4">
               <div className="flex items-center space-x-4">
                   {renderCheckbox('당도 서비스', farmData.serviceInfo.useSugarService, (e) => handleCheckboxChange('serviceInfo', 'useSugarService', e.target.checked))}
                   {farmData.serviceInfo.useSugarService && renderInput('당도계 정보', farmData.serviceInfo.sugarMeterInfo || '', (e) => handleChange('serviceInfo', 'sugarMeterInfo', e.target.value))}
               </div>
               <div className="flex items-center space-x-4">
                   {renderCheckbox('센서 서비스', farmData.serviceInfo.useSensorService, (e) => handleCheckboxChange('serviceInfo', 'useSensorService', e.target.checked))}
                   {farmData.serviceInfo.useSensorService && renderInput('센서 정보', farmData.serviceInfo.sensorInfo || '', (e) => handleChange('serviceInfo', 'sensorInfo', e.target.value))}
               </div>
            </div>
          </fieldset>

          <fieldset className="p-4 border rounded-md">
            <legend className="text-xl font-semibold text-gray-700 px-2">지원 사업 정보</legend>
            <div className="space-y-4">
              {farmData.supportPrograms.map((p, i) => (
                <div key={p.id} className="p-3 bg-gray-50 rounded-md border grid grid-cols-2 md:grid-cols-3 gap-3 relative">
                   <button type="button" onClick={() => removeSupportProgram(i)} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><TrashIcon /></button>
                   {renderInput('년도', p.year, (e) => updateSupportProgram(i, 'year', Number(e.target.value)), 'number')}
                   {renderInput('사업명', p.projectName, (e) => updateSupportProgram(i, 'projectName', e.target.value))}
                   {renderInput('사업 내용', p.projectDescription, (e) => updateSupportProgram(i, 'projectDescription', e.target.value))}
                   {renderInput('지방비', p.localGovtFund, (e) => updateSupportProgram(i, 'localGovtFund', Number(e.target.value)), 'number')}
                   {renderInput('자부담', p.selfFund, (e) => updateSupportProgram(i, 'selfFund', Number(e.target.value)), 'number')}
                   {renderCheckbox('선정', p.isSelected, (e) => updateSupportProgram(i, 'isSelected', e.target.checked))}
                </div>
              ))}
            </div>
            <button type="button" onClick={addSupportProgram} className="mt-4 flex items-center text-orange-600 hover:text-orange-800">
              <PlusIcon /><span className="ml-1">지원 사업 추가</span>
            </button>
          </fieldset>

          <fieldset className="p-4 border rounded-md">
            <legend className="text-xl font-semibold text-gray-700 px-2">년 기준 데이터</legend>
            <div className="space-y-4">
              {farmData.annualData.map((d, i) => (
                <div key={d.id} className="p-3 bg-gray-50 rounded-md border grid grid-cols-2 md:grid-cols-3 gap-3 relative">
                  <button type="button" onClick={() => removeAnnualData(i)} className="absolute top-2 right-2 text-red-500 hover:text-red-700"><TrashIcon /></button>
                  {renderInput('년도', d.year, (e) => updateAnnualData(i, 'year', Number(e.target.value)), 'number')}
                  {renderInput('평균 당도', d.avgBrix, (e) => updateAnnualData(i, 'avgBrix', Number(e.target.value)), 'number')}
                  {renderInput('예상생산량(관)', d.estimatedYield, (e) => updateAnnualData(i, 'estimatedYield', Number(e.target.value)), 'number')}
                  {renderInput('관당 판매가격', d.pricePerGwan, (e) => updateAnnualData(i, 'pricePerGwan', Number(e.target.value)), 'number')}
                  {renderInput('출하시기', d.shippingSeason, (e) => updateAnnualData(i, 'shippingSeason', e.target.value))}
                  {renderInput('비고', d.notes, (e) => updateAnnualData(i, 'notes', e.target.value))}
                  {renderCheckbox('해거리', d.hasAlternateBearing, (e) => updateAnnualData(i, 'hasAlternateBearing', e.target.checked))}
                </div>
              ))}
            </div>
            <button type="button" onClick={addAnnualData} className="mt-4 flex items-center text-orange-600 hover:text-orange-800">
              <PlusIcon /><span className="ml-1">년 기준 데이터 추가</span>
            </button>
          </fieldset>
          
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onCancel} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">취소</button>
            <button type="submit" className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600">저장</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FarmForm;
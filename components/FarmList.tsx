
import React, { useState, useMemo, useRef } from 'react';
import { Farm, PredefinedProjectName } from '../types';
import { exportFarmsToExcel, exportFarmContactsToExcel } from '../utils/excelExporter';
import { PencilIcon, TrashIcon, ExportIcon, BackupIcon, RestoreIcon, XIcon } from './icons';

interface FarmListProps {
  farms: Farm[];
  onEdit: (farm: Farm) => void;
  onDelete: (farmId: string) => void;
  onAddNew: () => void;
  onViewDetails: (farm: Farm) => void;
  onBackup: () => void;
  onRestore: (file: File) => void;
}

const FarmList: React.FC<FarmListProps> = ({ farms, onEdit, onDelete, onAddNew, onViewDetails, onBackup, onRestore }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all'); // 'all', 'sugar', 'sensor', 'corporate'
  const [supportFilter, setSupportFilter] = useState('all'); // 'all', 'yes', 'no'
  const [projectFilter, setProjectFilter] = useState('all');
  const [supportYearStart, setSupportYearStart] = useState('');
  const [supportYearEnd, setSupportYearEnd] = useState('');
  const [alternateBearingFilter, setAlternateBearingFilter] = useState('all'); // 'all', 'yes', 'no'
  const [alternateBearingYear, setAlternateBearingYear] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const filteredFarms = useMemo(() => {
    return farms.filter(farm => {
      const searchTermLower = searchTerm.toLowerCase();
      const searchMatch = farm.basicInfo.name.toLowerCase().includes(searchTermLower) ||
                          farm.basicInfo.contact.toLowerCase().includes(searchTermLower);

      const serviceMatch = (() => {
        if (serviceFilter === 'sugar') return farm.serviceInfo.useSugarService;
        if (serviceFilter === 'sensor') return farm.serviceInfo.useSensorService;
        if (serviceFilter === 'corporate') return farm.basicInfo.isCorporate;
        return true; // 'all'
      })();

      const supportMatch = (() => {
        if (supportFilter === 'no') return farm.supportPrograms.length === 0;
        if (supportFilter === 'yes') {
          if (farm.supportPrograms.length === 0) return false;
          
          const start = parseInt(supportYearStart);
          const end = parseInt(supportYearEnd);
          const startValid = !isNaN(start);
          const endValid = !isNaN(end);

          // If no year range is specified, just check for existence.
          if (!startValid && !endValid) {
            return true;
          }

          return farm.supportPrograms.some(program => {
              const year = program.year;
              const afterStart = startValid ? year >= start : true;
              const beforeEnd = endValid ? year <= end : true;
              return afterStart && beforeEnd;
          });
        }
        return true; // 'all'
      })();

      const alternateBearingMatch = (() => {
        if (alternateBearingFilter === 'all' || alternateBearingYear === '') {
            return true;
        }
        const year = parseInt(alternateBearingYear);
        if (isNaN(year)) {
            return true;
        }
        const dataForYear = farm.annualData.find(d => d.year === year);

        if (alternateBearingFilter === 'yes') {
            return !!dataForYear && dataForYear.hasAlternateBearing;
        }
        if (alternateBearingFilter === 'no') {
            return !dataForYear || !dataForYear.hasAlternateBearing;
        }
        return true;
      })();
      
      const projectMatch = (() => {
          if (projectFilter === 'all') {
              return true;
          }
          const predefinedNames = Object.values(PredefinedProjectName);
          return farm.supportPrograms.some(program => {
              if (projectFilter === PredefinedProjectName.ETC) {
                  return !predefinedNames.includes(program.projectName as PredefinedProjectName);
              }
              return program.projectName === projectFilter;
          });
      })();

      return searchMatch && serviceMatch && supportMatch && alternateBearingMatch && projectMatch;
    });
  }, [farms, searchTerm, serviceFilter, supportFilter, supportYearStart, supportYearEnd, alternateBearingFilter, alternateBearingYear, projectFilter]);
  
  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onRestore(file);
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-gray-800">농가 목록</h2>
        <div className="flex items-center flex-wrap justify-end gap-2">
            <input
                type="text"
                placeholder="농가명 또는 연락처 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                aria-label="농가명 또는 연락처 검색"
            />
             <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                aria-label="서비스 또는 농가 유형 필터"
            >
                <option value="all">서비스/유형 (전체)</option>
                <option value="sugar">당도 서비스 사용</option>
                <option value="sensor">센서 서비스 사용</option>
                <option value="corporate">기업농</option>
            </select>
             <select
                value={supportFilter}
                onChange={(e) => setSupportFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                aria-label="지원사업 참여 여부 필터"
            >
                <option value="all">지원사업 (전체)</option>
                <option value="yes">지원사업 참여 농가</option>
                <option value="no">지원사업 미참여 농가</option>
            </select>
            {supportFilter === 'yes' && (
              <>
                <input
                  type="number"
                  placeholder="시작년도"
                  value={supportYearStart}
                  onChange={(e) => setSupportYearStart(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-28"
                  aria-label="지원사업 시작년도"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  placeholder="종료년도"
                  value={supportYearEnd}
                  onChange={(e) => setSupportYearEnd(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-28"
                  aria-label="지원사업 종료년도"
                />
              </>
            )}
            <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                aria-label="지원사업명 필터"
            >
                <option value="all">지원사업명 (전체)</option>
                {Object.values(PredefinedProjectName).map(name => <option key={name} value={name}>{name}</option>)}
            </select>
            <select
                value={alternateBearingFilter}
                onChange={(e) => setAlternateBearingFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                aria-label="해거리 발생 여부 필터"
            >
                <option value="all">해거리 (전체)</option>
                <option value="yes">해거리 발생 농가</option>
                <option value="no">해거리 미발생 농가</option>
            </select>
            {alternateBearingFilter !== 'all' && (
                <input
                  type="number"
                  placeholder="검색년도"
                  value={alternateBearingYear}
                  onChange={(e) => setAlternateBearingYear(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-28"
                  aria-label="해거리 검색년도"
                />
            )}
            <button onClick={() => setShowExportModal(true)} className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-300">
                <ExportIcon />
                <span className="ml-2">Excel 내보내기</span>
            </button>
            <button onClick={onBackup} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300">
                <BackupIcon />
                <span className="ml-2">데이터 백업</span>
            </button>
            <button onClick={handleRestoreClick} className="flex items-center bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition duration-300">
                <RestoreIcon />
                <span className="ml-2">데이터 복원</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />
            <button onClick={onAddNew} className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition duration-300">
                신규 농가 추가
            </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700">농가명</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700">연락처</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700">주소</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700">면적(평)</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700">품종</th>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700 text-center">작업</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredFarms.length > 0 ? (
              filteredFarms.map(farm => (
                <tr key={farm.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onViewDetails(farm)}>
                  <td className="px-4 py-3 text-gray-800">{farm.basicInfo.name}</td>
                  <td className="px-4 py-3 text-gray-600">{farm.basicInfo.contact}</td>
                  <td className="px-4 py-3 text-gray-600">{farm.basicInfo.address}</td>
                  <td className="px-4 py-3 text-gray-600">{farm.basicInfo.areaPyeong.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">{farm.basicInfo.cultivar}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center items-center space-x-2">
                      <button onClick={(e) => { e.stopPropagation(); onEdit(farm); }} className="p-2 text-blue-600 hover:text-blue-800 transition duration-300" aria-label={`${farm.basicInfo.name} 정보 수정`}>
                        <PencilIcon />
                      </button>
                      <button onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`${farm.basicInfo.name} 농가 정보를 삭제하시겠습니까?`)) {
                          onDelete(farm.id);
                        }
                      }} className="p-2 text-red-600 hover:text-red-800 transition duration-300" aria-label={`${farm.basicInfo.name} 정보 삭제`}>
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-500">
                  {farms.length === 0 ? "등록된 농가 정보가 없습니다." : "검색 결과가 없습니다."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-sm m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Excel 내보내기 옵션</h3>
              <button onClick={() => setShowExportModal(false)} className="text-gray-500 hover:text-gray-800">
                <XIcon />
              </button>
            </div>
            <p className="text-gray-600 mb-6">내보낼 데이터 유형을 선택해주세요.</p>
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => {
                  exportFarmContactsToExcel(filteredFarms, 'JEUS_농가_연락처');
                  setShowExportModal(false);
                }}
                className="w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
              >
                연락처만 내보내기
              </button>
              <button
                onClick={() => {
                  exportFarmsToExcel(filteredFarms, 'JEUS_감귤_농가_전체_검색결과');
                  setShowExportModal(false);
                }}
                className="w-full text-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300"
              >
                전체 데이터 내보내기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmList;

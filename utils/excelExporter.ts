
import { Farm } from '../types';

declare const XLSX: any;

const formatBoolean = (value: boolean) => value ? 'Y' : 'N';

const formatSupportPrograms = (programs: Farm['supportPrograms']) => {
  if (!programs || programs.length === 0) return '';
  return programs.map(p => 
    `[${p.year}] ${p.projectName} (선정: ${formatBoolean(p.isSelected)}, 자부담: ${p.selfFund.toLocaleString()}원)`
  ).join('\n');
};

const formatAnnualData = (data: Farm['annualData']) => {
  if (!data || data.length === 0) return '';
  return data.map(d => 
    `[${d.year}] 당도:${d.avgBrix}Brix, 생산량:${d.estimatedYield}관, 해거리:${formatBoolean(d.hasAlternateBearing)}`
  ).join('\n');
};

export const exportFarmsToExcel = (farms: Farm[], fileName: string = '농가_데이터'): void => {
  const worksheetData = farms.map(farm => ({
    '농가명': farm.basicInfo.name,
    '연락처': farm.basicInfo.contact,
    '주소': farm.basicInfo.address,
    '면적(평)': farm.basicInfo.areaPyeong,
    '품종': farm.basicInfo.cultivar,
    '과수본수': farm.basicInfo.treeCount,
    '경사도': farm.facilityInfo.slope,
    '식재간격/원지정비': farm.facilityInfo.plantingDistance,
    '피복유무': formatBoolean(farm.facilityInfo.hasCovering),
    '피복종류': farm.facilityInfo.coveringType || '',
    '전원': formatBoolean(farm.facilityInfo.hasPower),
    '인터넷': formatBoolean(farm.facilityInfo.hasInternet),
    '우산식': formatBoolean(farm.facilityInfo.hasUmbrellaSystem),
    '점적호스': formatBoolean(farm.facilityInfo.hasDripHose),
    '스프링쿨러': formatBoolean(farm.facilityInfo.hasSprinkler),
    '방풍망': formatBoolean(farm.facilityInfo.hasWindbreak),
    '개폐기': formatBoolean(farm.facilityInfo.hasOpener),
    '자청비 ID': farm.serviceInfo.jacheongbiId,
    '당도서비스': formatBoolean(farm.serviceInfo.useSugarService),
    '당도계 정보': farm.serviceInfo.sugarMeterInfo || '',
    '센서서비스': formatBoolean(farm.serviceInfo.useSensorService),
    '센서 정보': farm.serviceInfo.sensorInfo || '',
    '지원사업 정보': formatSupportPrograms(farm.supportPrograms),
    '연간 데이터': formatAnnualData(farm.annualData),
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '농가정보');

  // Adjust column widths
  const colWidths = [
    { wch: 20 }, { wch: 15 }, { wch: 40 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, // Basic
    { wch: 10 }, { wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, // Facility
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, // Facility cont.
    { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 20 }, // Service
    { wch: 50 }, { wch: 50 } // Programs & Annual Data
  ];
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

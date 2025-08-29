import { Farm } from '../types';
import * as XLSX from 'xlsx';

// Helper to sanitize sheet names (max 31 chars, no invalid chars)
const sanitizeSheetName = (name: string): string => {
  return name.replace(/[\\/*?:"<>|]/g, '').substring(0, 31);
};

// Helper to format boolean values
const formatBoolean = (value: boolean) => value ? 'Y' : 'N';

// Cell styles
const border = {
    top: { style: 'thin', color: { rgb: "FFB0B0B0" } },
    bottom: { style: 'thin', color: { rgb: "FFB0B0B0" } },
    left: { style: 'thin', color: { rgb: "FFB0B0B0" } },
    right: { style: 'thin', color: { rgb: "FFB0B0B0" } }
};

const titleStyle = { font: { bold: true, sz: 14, color: { rgb: "FF444444" } }, alignment: { vertical: 'center', horizontal: 'center' } };

const headerStyle = { font: { bold: true, color: { rgb: "FF444444" } }, fill: { fgColor: { rgb: "FFEAEAEA" } }, alignment: { horizontal: 'center', vertical: 'center' }, border };

const labelStyle = { font: { bold: true }, fill: { fgColor: { rgb: "FFF5F5F5" } }, alignment: { vertical: 'center', wrapText: true }, border };

const valueStyle = { alignment: { vertical: 'center', wrapText: true }, border };

const linkStyle = { font: { color: { rgb: "FF0000FF" }, underline: true }, alignment: { vertical: 'center', wrapText: true }, border };


// Adds a simple key-value section to the worksheet data array
const addKeyValueSection = (wsData: any[][], title: string, data: [string, any][], merges: any[], currentRow: number) => {
  if (data.length === 0) return 0;
  merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 1 } });
  wsData.push([{ v: title, s: titleStyle }, null]);
  data.forEach(([label, value]) => {
    wsData.push([{ v: label, s: labelStyle }, { v: value ?? '-', s: valueStyle }]);
  });
  wsData.push([]); // Spacer row
  return data.length + 2; // Rows added
};

// Adds a table section to the worksheet data array
const addTableSection = (wsData: any[][], title: string, headers: string[], dataRows: any[][], merges: any[], currentRow: number) => {
  if (dataRows.length === 0) return 0;
  merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: headers.length - 1 } });
  wsData.push([{ v: title, s: titleStyle }, ...Array(headers.length - 1).fill(null)]);
  wsData.push(headers.map(h => ({ v: h, s: headerStyle })));
  dataRows.forEach(row => {
    wsData.push(row.map(cellValue => ({ v: cellValue ?? '-', s: valueStyle })));
  });
  wsData.push([]); // Spacer row
  return dataRows.length + 3; // Rows added
};


export const exportFarmsToExcel = (farms: Farm[], fileName: string = '농가_리포트'): void => {
  const workbook = XLSX.utils.book_new();

  // 1. Create Summary Sheet if there are farms
  if (farms.length > 0) {
    const summaryHeaders = ['농가명', '연락처', '주소', '면적(평)', '기업농', '지원사업', '상담일지'];
    const summaryData: any[][] = [
      summaryHeaders.map(h => ({ v: h, s: headerStyle }))
    ];

    farms.forEach(farm => {
      const sheetName = sanitizeSheetName(farm.basicInfo.name);
      const farmNameCell = {
        v: farm.basicInfo.name,
        l: { Target: `'${sheetName}'!A1` }, // Corrected hyperlink reference
        s: linkStyle
      };
      
      const hasSupportPrograms = farm.supportPrograms && farm.supportPrograms.length > 0;
      const hasConsultationLogs = farm.basicInfo.isCorporate && farm.corporateFarmDetails && farm.corporateFarmDetails.consultationLogs.length > 0;

      summaryData.push([
        farmNameCell,
        { v: farm.basicInfo.contact, s: valueStyle },
        { v: farm.basicInfo.address, s: valueStyle },
        { v: farm.basicInfo.areaPyeong, s: valueStyle },
        { v: formatBoolean(farm.basicInfo.isCorporate), s: valueStyle },
        { v: formatBoolean(hasSupportPrograms), s: valueStyle },
        { v: formatBoolean(hasConsultationLogs), s: valueStyle }
      ]);
    });

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWs['!cols'] = [ { wch: 20 }, { wch: 15 }, { wch: 40 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 8 } ];
    XLSX.utils.book_append_sheet(workbook, summaryWs, '농가 요약 목록');
  }

  // 2. Create individual farm detail sheets
  farms.forEach(farm => {
    const wsData: any[][] = [];
    const merges: any[] = [];
    let currentRow = 0;

    // --- Basic Info Section ---
    const basicInfoData: [string, any][] = [
      ['농가명', farm.basicInfo.name],
      ['연락처', farm.basicInfo.contact],
      ['주소', farm.basicInfo.address],
      ['면적(평)', farm.basicInfo.areaPyeong.toLocaleString()],
      ['품종', farm.basicInfo.cultivar],
      ['과수본수', `${farm.basicInfo.treeCount.toLocaleString()} 주`],
      ['기업농', formatBoolean(farm.basicInfo.isCorporate)],
    ];
    currentRow += addKeyValueSection(wsData, '기본 농가 정보', basicInfoData, merges, currentRow);

    // --- Corporate Farm Section ---
    if (farm.basicInfo.isCorporate && farm.corporateFarmDetails) {
      const details = farm.corporateFarmDetails;
      const corporateInfoData: [string, any][] = [
        ['상담년도', details.year],
        ['상담일', details.consultationDate],
        ['예상관수', `${details.estimatedQuantity.toLocaleString()} 관`],
        ['계약관수', `${details.contractedQuantity.toLocaleString()} 관`],
        ['계약여부', formatBoolean(details.isContracted)],
        ['특이사항', details.specialNotes],
      ];
      currentRow += addKeyValueSection(wsData, '기업농 관련 정보', corporateInfoData, merges, currentRow);
      
      if (details.isContracted) {
          const contractInfoData: [string, any][] = [
              ['계약일', details.contractDate],
              ['계약금', `${details.downPayment?.toLocaleString() ?? 0} 원`],
              ['잔금일', details.balanceDueDate],
              ['잔금', `${details.balancePayment?.toLocaleString() ?? 0} 원`],
              ['멀칭작업일', details.mulchingWorkDate],
          ];
          currentRow += addKeyValueSection(wsData, '계약 상세 정보', contractInfoData, merges, currentRow);
      }
      
      if (details.consultationLogs && details.consultationLogs.length > 0) {
          const headers = ['날짜', '구분', '내용', '비고'];
          const logRows = details.consultationLogs.map(log => [log.date, log.category, log.content, log.notes]);
          currentRow += addTableSection(wsData, '상담 일지 내역', headers, logRows, merges, currentRow);
      }
    }

    // --- Facility Info Section ---
    const { facilityInfo } = farm;
    const facilityInfoData: [string, any][] = [
      ['경사도', facilityInfo.slope],
      ['식재간격/원지정비', facilityInfo.plantingDistance],
      ['피복', `${formatBoolean(facilityInfo.hasCovering)} ${facilityInfo.hasCovering ? `(${facilityInfo.coveringType || '종류 미지정'})` : ''}`],
      ['전원', formatBoolean(facilityInfo.hasPower)],
      ['인터넷', formatBoolean(facilityInfo.hasInternet)],
      ['우산식', formatBoolean(facilityInfo.hasUmbrellaSystem)],
      ['점적호스', formatBoolean(facilityInfo.hasDripHose)],
      ['스프링쿨러', formatBoolean(facilityInfo.hasSprinkler)],
      ['방풍망', formatBoolean(facilityInfo.hasWindbreak)],
      ['개폐기', formatBoolean(facilityInfo.hasOpener)],
    ];
    currentRow += addKeyValueSection(wsData, '시설 정보', facilityInfoData, merges, currentRow);

    // --- Service Info Section ---
    const { serviceInfo } = farm;
    const serviceInfoData: [string, any][] = [
      ['자청비 ID', serviceInfo.jacheongbiId],
      ['당도 서비스', `${formatBoolean(serviceInfo.useSugarService)} ${serviceInfo.useSugarService ? `(${serviceInfo.sugarMeterInfo || '정보 없음'})` : ''}`],
      ['센서 서비스', `${formatBoolean(serviceInfo.useSensorService)} ${serviceInfo.useSensorService ? `(${serviceInfo.sensorInfo || '정보 없음'})` : ''}`],
    ];
    currentRow += addKeyValueSection(wsData, '사용 서비스 정보', serviceInfoData, merges, currentRow);

    // --- Support Programs Table ---
    if (farm.supportPrograms.length > 0) {
        const headers = ['년도', '사업명', '내용', '선정', '자부담(원)'];
        const programRows = farm.supportPrograms.map(p => [ p.year, p.projectName, p.projectDescription, formatBoolean(p.isSelected), p.selfFund.toLocaleString() ]);
        currentRow += addTableSection(wsData, '지원 사업 정보', headers, programRows, merges, currentRow);
    }

    // --- Annual Data Table ---
    if (farm.annualData.length > 0) {
        const headers = ['년도', '평균당도(Brix)', '예상생산량(관)', '관당가격(원)', '해거리', '비고'];
        const annualRows = farm.annualData.map(d => [ d.year, d.avgBrix, d.estimatedYield.toLocaleString(), d.pricePerGwan.toLocaleString(), formatBoolean(d.hasAlternateBearing), d.notes ]);
        currentRow += addTableSection(wsData, '년 기준 데이터', headers, annualRows, merges, currentRow);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(wsData);
    worksheet['!merges'] = merges;
    worksheet['!cols'] = [
        { wch: 20 }, { wch: 45 }, { wch: 45 }, { wch: 15 }, { wch: 15 }, { wch: 25 },
    ];

    const sheetName = sanitizeSheetName(farm.basicInfo.name);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  });
  
  // 3. Handle case where there are no farms
  if (farms.length === 0) {
    const worksheet = XLSX.utils.aoa_to_sheet([['내보낼 데이터가 없습니다.']]);
    XLSX.utils.book_append_sheet(workbook, worksheet, '정보 없음');
  }

  // 4. Write the workbook to a file
  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportFarmContactsToExcel = (farms: Farm[], fileName: string = '농가_연락처'): void => {
    const workbook = XLSX.utils.book_new();

    if (farms.length > 0) {
        const headers = ['농가명', '연락처'];
        const wsData: any[][] = [
            headers.map(h => ({ v: h, s: headerStyle }))
        ];

        farms.forEach(farm => {
            wsData.push([
                { v: farm.basicInfo.name, s: valueStyle },
                { v: farm.basicInfo.contact, s: valueStyle }
            ]);
        });

        const worksheet = XLSX.utils.aoa_to_sheet(wsData);
        worksheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(workbook, worksheet, '연락처 목록');
    } else {
        const worksheet = XLSX.utils.aoa_to_sheet([['내보낼 데이터가 없습니다.']]);
        XLSX.utils.book_append_sheet(workbook, worksheet, '정보 없음');
    }

    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
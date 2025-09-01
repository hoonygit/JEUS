import React, { useState, useMemo } from 'react';
import { Farm } from '../types';
import { XIcon } from './icons';

interface FarmDetailsProps {
    farm: Farm;
    onClose: () => void;
}

type Tab = 'basic' | 'facility' | 'support' | 'corporate' | 'annual';

const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 border-b-2 border-orange-400 pb-2 mb-4">{title}</h3>
        {children}
    </section>
);

const DetailItem: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-1 text-base text-gray-900">{children}</p>
    </div>
);

const TabButton: React.FC<{active: boolean, onClick: () => void, children: React.ReactNode}> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors duration-200 focus:outline-none ${
            active 
            ? 'border-b-2 border-orange-500 text-orange-600' 
            : 'text-gray-500 hover:text-orange-500'
        }`}
        role="tab"
        aria-selected={active}
    >
        {children}
    </button>
);

const FarmDetails: React.FC<FarmDetailsProps> = ({ farm, onClose }) => {
    const { name, contact } = farm;
    const [activeTab, setActiveTab] = useState<Tab>('basic');
    const [selectedPlotId, setSelectedPlotId] = useState<string | null>(farm.plots[0]?.id || null);

    const selectedPlot = useMemo(() => {
        return farm.plots.find(p => p.id === selectedPlotId);
    }, [farm.plots, selectedPlotId]);

    const formatBoolean = (value: boolean) => value ? <span className="font-semibold text-green-600">Y</span> : <span className="font-semibold text-red-600">N</span>;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="farm-details-title"
        >
            <div 
                className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-start sm:items-center justify-between p-5 border-b border-gray-200 flex-col sm:flex-row gap-4">
                    <div>
                        <h2 id="farm-details-title" className="text-2xl font-bold text-gray-800">{name} - 상세 정보</h2>
                        <p className="text-sm text-gray-500 mt-1">{contact}</p>
                    </div>
                     {farm.plots.length > 0 && (
                        <div className="flex items-center space-x-2">
                            <label htmlFor="plot-selector" className="text-sm font-medium text-gray-700">필지 선택:</label>
                            <select
                                id="plot-selector"
                                value={selectedPlotId || ''}
                                onChange={(e) => setSelectedPlotId(e.target.value)}
                                className="px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                            >
                                {farm.plots.map(p => (
                                    <option key={p.id} value={p.id}>{p.address}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <button 
                        onClick={onClose} 
                        className="p-2 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        aria-label="닫기"
                    >
                        <XIcon />
                    </button>
                </header>

                <div className="border-b border-gray-200 px-5">
                    <nav className="-mb-px flex space-x-6" role="tablist">
                        <TabButton active={activeTab === 'basic'} onClick={() => setActiveTab('basic')}>필지 기본</TabButton>
                        <TabButton active={activeTab === 'facility'} onClick={() => setActiveTab('facility')}>시설/서비스</TabButton>
                        <TabButton active={activeTab === 'corporate'} onClick={() => setActiveTab('corporate')}>기업농/상담</TabButton>
                        <TabButton active={activeTab === 'support'} onClick={() => setActiveTab('support')}>지원사업</TabButton>
                        <TabButton active={activeTab === 'annual'} onClick={() => setActiveTab('annual')}>연간 데이터</TabButton>
                    </nav>
                </div>
                
                <main className="p-6 space-y-6 overflow-y-auto">
                    {!selectedPlot && farm.plots.length > 0 && <p className="text-center text-gray-500">표시할 필지를 선택해주세요.</p>}
                    {!selectedPlot && farm.plots.length === 0 && <p className="text-center text-gray-500">등록된 필지 정보가 없습니다.</p>}

                    {selectedPlot && (
                        <>
                        {activeTab === 'basic' && (
                            <div role="tabpanel">
                                <DetailSection title="필지 기본 정보">
                                    <div className="grid grid-cols-2 gap-y-4 md:grid-cols-3 gap-x-6">
                                        <DetailItem label="주소">{selectedPlot.address || '-'}</DetailItem>
                                        <DetailItem label="면적(평)">{selectedPlot.areaPyeong.toLocaleString()}</DetailItem>
                                        <DetailItem label="품종">{selectedPlot.cultivar || '-'}</DetailItem>
                                        <DetailItem label="과수본수">{selectedPlot.treeCount.toLocaleString()} 주</DetailItem>
                                    </div>
                                </DetailSection>
                            </div>
                        )}
                        
                        {activeTab === 'facility' && (
                            <div role="tabpanel">
                                <DetailSection title="시설 정보">
                                    <div className="grid grid-cols-2 gap-y-4 md:grid-cols-4 gap-x-6">
                                        <DetailItem label="경사도">{selectedPlot.facilityInfo.slope || '-'}</DetailItem>
                                        <DetailItem label="식재간격/원지정비">{selectedPlot.facilityInfo.plantingDistance || '-'}</DetailItem>
                                        <DetailItem label="피복">{formatBoolean(selectedPlot.facilityInfo.hasCovering)} {selectedPlot.facilityInfo.hasCovering && `(${selectedPlot.facilityInfo.coveringType || '종류 미지정'})`}</DetailItem>
                                        <DetailItem label="전원">{formatBoolean(selectedPlot.facilityInfo.hasPower)}</DetailItem>
                                        <DetailItem label="인터넷">{formatBoolean(selectedPlot.facilityInfo.hasInternet)}</DetailItem>
                                        <DetailItem label="우산식">{formatBoolean(selectedPlot.facilityInfo.hasUmbrellaSystem)}</DetailItem>
                                        <DetailItem label="점적호스">{formatBoolean(selectedPlot.facilityInfo.hasDripHose)}</DetailItem>
                                        <DetailItem label="스프링쿨러">{formatBoolean(selectedPlot.facilityInfo.hasSprinkler)}</DetailItem>
                                        <DetailItem label="방풍망">{formatBoolean(selectedPlot.facilityInfo.hasWindbreak)}</DetailItem>
                                        <DetailItem label="개폐기">{formatBoolean(selectedPlot.facilityInfo.hasOpener)}</DetailItem>
                                    </div>
                                </DetailSection>

                                <DetailSection title="사용 서비스 정보">
                                    <div className="grid grid-cols-1 gap-y-4 md:grid-cols-2 gap-x-6">
                                        <DetailItem label="자청비 ID">{selectedPlot.serviceInfo.jacheongbiId || '-'}</DetailItem>
                                        <DetailItem label="당도 서비스">{formatBoolean(selectedPlot.serviceInfo.useSugarService)} {selectedPlot.serviceInfo.useSugarService && `(${selectedPlot.serviceInfo.sugarMeterInfo || '정보 없음'})`}</DetailItem>
                                        <DetailItem label="센서 서비스">{formatBoolean(selectedPlot.serviceInfo.useSensorService)} {selectedPlot.serviceInfo.useSensorService && `(${selectedPlot.serviceInfo.sensorInfo || '정보 없음'})`}</DetailItem>
                                    </div>
                                </DetailSection>
                            </div>
                        )}
                        
                        {activeTab === 'corporate' && (
                           <div role="tabpanel">
                               <DetailSection title="기업농 관리">
                                   <DetailItem label="기업농 여부">{formatBoolean(selectedPlot.isCorporate)}</DetailItem>
                               </DetailSection>

                               {selectedPlot.isCorporate && selectedPlot.corporateFarmDetails && (
                                   <DetailSection title="기업농 계약 정보">
                                       <div className="grid grid-cols-2 gap-y-4 md:grid-cols-3 gap-x-6">
                                           <DetailItem label="상담년도">{selectedPlot.corporateFarmDetails.year}</DetailItem>
                                           <DetailItem label="상담일">{selectedPlot.corporateFarmDetails.consultationDate || '-'}</DetailItem>
                                           <DetailItem label="예상관수">{selectedPlot.corporateFarmDetails.estimatedQuantity.toLocaleString()} 관</DetailItem>
                                           <DetailItem label="계약관수">{selectedPlot.corporateFarmDetails.contractedQuantity.toLocaleString()} 관</DetailItem>
                                           <DetailItem label="계약여부">{formatBoolean(selectedPlot.corporateFarmDetails.isContracted)}</DetailItem>
                                           <DetailItem label="특이사항">{selectedPlot.corporateFarmDetails.specialNotes || '-'}</DetailItem>
                                       </div>
                                       {selectedPlot.corporateFarmDetails.isContracted && (
                                           <div className="mt-4 p-4 border rounded-md bg-gray-50 grid grid-cols-2 gap-y-4 md:grid-cols-3 gap-x-6">
                                               <h4 className="col-span-full font-semibold text-gray-700">계약 상세</h4>
                                               <DetailItem label="계약일">{selectedPlot.corporateFarmDetails.contractDate || '-'}</DetailItem>
                                               <DetailItem label="계약금">{selectedPlot.corporateFarmDetails.downPayment?.toLocaleString() || 0} 원</DetailItem>
                                               <DetailItem label="잔금일">{selectedPlot.corporateFarmDetails.balanceDueDate || '-'}</DetailItem>
                                               <DetailItem label="잔금">{selectedPlot.corporateFarmDetails.balancePayment?.toLocaleString() || 0} 원</DetailItem>
                                               <DetailItem label="멀칭작업일">{selectedPlot.corporateFarmDetails.mulchingWorkDate || '-'}</DetailItem>
                                           </div>
                                       )}
                                   </DetailSection>
                               )}

                               {selectedPlot.isCorporate && selectedPlot.consultationLogs && selectedPlot.consultationLogs.length > 0 && (
                                   <DetailSection title="상담 일지 내역">
                                       <div className="overflow-x-auto border rounded-lg">
                                           <table className="w-full text-left table-auto">
                                               <thead className="bg-gray-50">
                                                   <tr>
                                                       <th className="px-4 py-2 text-sm font-semibold text-gray-600">날짜</th>
                                                       <th className="px-4 py-2 text-sm font-semibold text-gray-600">구분</th>
                                                       <th className="px-4 py-2 text-sm font-semibold text-gray-600">내용</th>
                                                       <th className="px-4 py-2 text-sm font-semibold text-gray-600">비고</th>
                                                   </tr>
                                               </thead>
                                               <tbody className="divide-y divide-gray-200">
                                                   {selectedPlot.consultationLogs.map((log) => (
                                                       <tr key={log.id}>
                                                           <td className="px-4 py-2 whitespace-nowrap">{log.date}</td>
                                                           <td className="px-4 py-2">{log.category}</td>
                                                           <td className="px-4 py-2">{log.content}</td>
                                                           <td className="px-4 py-2 text-gray-600">{log.notes}</td>
                                                       </tr>
                                                   ))}
                                               </tbody>
                                           </table>
                                       </div>
                                   </DetailSection>
                               )}
                               
                               {selectedPlot.isCorporate && (!selectedPlot.corporateFarmDetails && (!selectedPlot.consultationLogs || selectedPlot.consultationLogs.length === 0)) && (
                                   <p className="text-gray-500">등록된 기업농 계약 정보 또는 상담 일지가 없습니다.</p>
                               )}
                           </div>
                        )}

                        {activeTab === 'support' && (
                            <div role="tabpanel">
                                <DetailSection title="지원 사업 정보">
                                    {selectedPlot.supportPrograms.length > 0 ? (
                                        <div className="overflow-x-auto border rounded-lg">
                                            <table className="w-full text-left table-auto">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-sm font-semibold text-gray-600">년도</th>
                                                        <th className="px-4 py-2 text-sm font-semibold text-gray-600">사업명</th>
                                                        <th className="px-4 py-2 text-sm font-semibold text-gray-600">내용</th>
                                                        <th className="px-4 py-2 text-sm font-semibold text-center text-gray-600">선정</th>
                                                        <th className="px-4 py-2 text-sm font-semibold text-right text-gray-600">지원금(원)</th>
                                                        <th className="px-4 py-2 text-sm font-semibold text-right text-gray-600">자부담(원)</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {selectedPlot.supportPrograms.map((p) => (
                                                        <tr key={p.id}>
                                                            <td className="px-4 py-2">{p.year}</td>
                                                            <td className="px-4 py-2 font-medium">{p.projectName}</td>
                                                            <td className="px-4 py-2 text-gray-600">{p.projectDescription}</td>
                                                            <td className="px-4 py-2 text-center">{formatBoolean(p.isSelected)}</td>
                                                            <td className="px-4 py-2 text-right">{p.localGovtFund.toLocaleString()}</td>
                                                            <td className="px-4 py-2 text-right">{p.selfFund.toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">이 필지에 등록된 지원 사업 정보가 없습니다.</p>
                                    )}
                                </DetailSection>
                            </div>
                        )}

                        {activeTab === 'annual' && (
                            <div role="tabpanel">
                                <DetailSection title="년 기준 데이터">
                                    {selectedPlot.annualData.length > 0 ? (
                                        <div className="overflow-x-auto border rounded-lg">
                                            <table className="w-full text-left table-auto">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-2 text-sm font-semibold text-gray-600">년도</th>
                                                        <th className="px-4 py-2 text-sm font-semibold text-gray-600">평균당도(Brix)</th>
                                                        <th className="px-4 py-2 text-sm font-semibold text-gray-600">예상생산량(관)</th>
                                                        <th className="px-4 py-2 text-sm font-semibold text-right text-gray-600">관당가격(원)</th>
                                                        <th className="px-4 py-2 text-sm font-semibold text-center text-gray-600">해거리</th>
                                                        <th className="px-4 py-2 text-sm font-semibold text-gray-600">비고</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {selectedPlot.annualData.map((d) => (
                                                        <tr key={d.id}>
                                                            <td className="px-4 py-2">{d.year}</td>
                                                            <td className="px-4 py-2">{d.avgBrix}</td>
                                                            <td className="px-4 py-2">{d.estimatedYield.toLocaleString()}</td>
                                                            <td className="px-4 py-2 text-right">{d.pricePerGwan.toLocaleString()}</td>
                                                            <td className="px-4 py-2 text-center">{formatBoolean(d.hasAlternateBearing)}</td>
                                                            <td className="px-4 py-2 text-gray-600">{d.notes}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">등록된 연간 데이터가 없습니다.</p>
                                    )}
                                </DetailSection>
                            </div>
                        )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default React.memo(FarmDetails);
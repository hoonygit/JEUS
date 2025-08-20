import { Pool, PoolClient } from 'pg';
import { Farm } from '@/types';

// 전역 범위에서 Pool 인스턴스를 캐시하여 연결을 재사용합니다.
let pool: Pool;

if (!pool) {
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL 환경 변수가 설정되지 않았습니다.");
    }
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });
}

// DB row를 Farm 객체의 각 부분으로 변환하는 헬퍼 함수
const rowToFarmParts = (row: any) => {
    // 기본 정보
    const basicInfo = {
        id: row.id, name: row.name, contact: row.contact, address: row.address,
        areaPyeong: row.area_pyeong, cultivar: row.cultivar, treeCount: row.tree_count, isCorporate: row.is_corporate
    };
    // 시설 정보
    const facilityInfo = {
        slope: row.slope, plantingDistance: row.planting_distance, hasCovering: row.has_covering, coveringType: row.covering_type,
        hasPower: row.has_power, hasInternet: row.has_internet, hasUmbrellaSystem: row.has_umbrella_system, hasDripHose: row.has_drip_hose,
        hasSprinkler: row.has_sprinkler, hasWindbreak: row.has_windbreak, hasOpener: row.has_opener
    };
    // 서비스 정보
    const serviceInfo = {
        jacheongbiId: row.jacheongbi_id, jacheongbiPw: row.jacheongbi_pw, useSugarService: row.use_sugar_service,
        sugarMeterInfo: row.sugar_meter_info, useSensorService: row.use_sensor_service, sensorInfo: row.sensor_info
    };
    // 기업농 상세 정보 (is_corporate가 true일 경우에만)
    const corporateFarmDetails = row.is_corporate ? {
        year: row.corporate_year, consultationDate: row.consultation_date ? new Date(row.consultation_date).toISOString().slice(0, 10) : '',
        estimatedQuantity: row.estimated_quantity, contractedQuantity: row.contracted_quantity, isContracted: row.is_contracted,
        specialNotes: row.special_notes, contractDate: row.contract_date ? new Date(row.contract_date).toISOString().slice(0, 10) : undefined,
        downPayment: row.down_payment, balanceDueDate: row.balance_due_date ? new Date(row.balance_due_date).toISOString().slice(0, 10) : undefined,
        balancePayment: row.balance_payment, mulchingWorkDate: row.mulching_work_date ? new Date(row.mulching_work_date).toISOString().slice(0, 10) : undefined,
        // 관련 데이터는 이후에 채워짐
        consultationLogs: []
    } : undefined;
    return { basicInfo, facilityInfo, serviceInfo, corporateFarmDetails };
};

// 페이지네이션을 적용하여 농가 데이터를 가져옵니다.
export const getFarms = async (page: number, limit: number): Promise<{ farms: Farm[], totalPages: number }> => {
    const client = await pool.connect();
    try {
        // 1. 전체 농가 수를 계산하여 총 페이지 수를 결정합니다.
        const totalFarmsResult = await client.query('SELECT COUNT(*) FROM farms');
        const totalFarms = parseInt(totalFarmsResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalFarms / limit);

        if (totalFarms === 0) {
            return { farms: [], totalPages: 0 };
        }

        // 2. 현재 페이지에 해당하는 농가 목록을 가져옵니다.
        const offset = (page - 1) * limit;
        const farmsRes = await client.query('SELECT * FROM farms ORDER BY name LIMIT $1 OFFSET $2', [limit, offset]);
        if (farmsRes.rows.length === 0) return { farms: [], totalPages };

        const farmMap = new Map<string, Farm>();
        farmsRes.rows.forEach(row => {
            const { basicInfo, facilityInfo, serviceInfo, corporateFarmDetails } = rowToFarmParts(row);
            farmMap.set(row.id, {
                id: row.id,
                basicInfo,
                facilityInfo,
                serviceInfo,
                corporateFarmDetails,
                supportPrograms: [],
                annualData: [],
            });
        });

        // 3. 가져온 농가 ID 목록을 기반으로 관련 데이터를 한 번에 조회합니다.
        const farmIds = Array.from(farmMap.keys());
        const [supportRes, annualRes, consultationRes] = await Promise.all([
            client.query('SELECT * FROM support_programs WHERE farm_id = ANY($1::text[])', [farmIds]),
            client.query('SELECT * FROM annual_data WHERE farm_id = ANY($1::text[])', [farmIds]),
            client.query('SELECT * FROM consultation_logs WHERE farm_id = ANY($1::text[])', [farmIds])
        ]);

        // 4. 조회된 관련 데이터를 각 농가 객체에 매핑합니다.
        supportRes.rows.forEach(row => farmMap.get(row.farm_id)?.supportPrograms.push({ ...row, selfFund: row.self_fund, localGovtFund: row.local_govt_fund, projectName: row.project_name, projectDescription: row.project_description, isSelected: row.is_selected }));
        annualRes.rows.forEach(row => farmMap.get(row.farm_id)?.annualData.push({ ...row, avgBrix: row.avg_brix, hasAlternateBearing: row.has_alternate_bearing, estimatedYield: row.estimated_yield, pricePerGwan: row.price_per_gwan, shippingSeason: row.shipping_season}));
        consultationRes.rows.forEach(row => {
            const farm = farmMap.get(row.farm_id);
            if (farm?.corporateFarmDetails) {
                farm.corporateFarmDetails.consultationLogs.push({ ...row, date: new Date(row.date).toISOString().slice(0, 10) });
            }
        });
        
        return { farms: Array.from(farmMap.values()), totalPages };
    } finally {
        client.release();
    }
};


// 단일 농가 데이터를 트랜잭션으로 저장 (생성 또는 업데이트)
export const saveFarm = async (farm: Farm): Promise<Farm> => {
    const client = await pool.connect();
    try {
        // 데이터 일관성을 위해 트랜잭션을 시작합니다.
        await client.query('BEGIN');

        const { id, basicInfo, facilityInfo, serviceInfo, corporateFarmDetails, supportPrograms, annualData } = farm;
        
        // UPSERT 쿼리: id가 존재하면 UPDATE, 없으면 INSERT
        const upsertFarmQuery = `
            INSERT INTO farms (
                id, name, contact, address, area_pyeong, cultivar, tree_count, is_corporate,
                slope, planting_distance, has_covering, covering_type, has_power, has_internet, has_umbrella_system,
                has_drip_hose, has_sprinkler, has_windbreak, has_opener, jacheongbi_id, jacheongbi_pw,
                use_sugar_service, sugar_meter_info, use_sensor_service, sensor_info,
                corporate_year, consultation_date, estimated_quantity, contracted_quantity, is_contracted,
                special_notes, contract_date, down_payment, balance_due_date, balance_payment, mulching_work_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name, contact = EXCLUDED.contact, address = EXCLUDED.address, area_pyeong = EXCLUDED.area_pyeong, cultivar = EXCLUDED.cultivar, tree_count = EXCLUDED.tree_count, is_corporate = EXCLUDED.is_corporate,
                slope = EXCLUDED.slope, planting_distance = EXCLUDED.planting_distance, has_covering = EXCLUDED.has_covering, covering_type = EXCLUDED.covering_type, has_power = EXCLUDED.has_power, has_internet = EXCLUDED.has_internet,
                has_umbrella_system = EXCLUDED.has_umbrella_system, has_drip_hose = EXCLUDED.has_drip_hose, has_sprinkler = EXCLUDED.has_sprinkler, has_windbreak = EXCLUDED.has_windbreak, has_opener = EXCLUDED.has_opener,
                jacheongbi_id = EXCLUDED.jacheongbi_id, jacheongbi_pw = EXCLUDED.jacheongbi_pw, use_sugar_service = EXCLUDED.use_sugar_service, sugar_meter_info = EXCLUDED.sugar_meter_info,
                use_sensor_service = EXCLUDED.use_sensor_service, sensor_info = EXCLUDED.sensor_info, corporate_year = EXCLUDED.corporate_year, consultation_date = EXCLUDED.consultation_date,
                estimated_quantity = EXCLUDED.estimated_quantity, contracted_quantity = EXCLUDED.contracted_quantity, is_contracted = EXCLUDED.is_contracted, special_notes = EXCLUDED.special_notes,
                contract_date = EXCLUDED.contract_date, down_payment = EXCLUDED.down_payment, balance_due_date = EXCLUDED.balance_due_date, balance_payment = EXCLUDED.balance_payment, mulching_work_date = EXCLUDED.mulching_work_date;
        `;
        await client.query(upsertFarmQuery, [
            id, basicInfo.name, basicInfo.contact, basicInfo.address, basicInfo.areaPyeong, basicInfo.cultivar, basicInfo.treeCount, basicInfo.isCorporate,
            facilityInfo.slope, facilityInfo.plantingDistance, facilityInfo.hasCovering, facilityInfo.coveringType || null, facilityInfo.hasPower, facilityInfo.hasInternet, facilityInfo.hasUmbrellaSystem,
            facilityInfo.hasDripHose, facilityInfo.hasSprinkler, facilityInfo.hasWindbreak, facilityInfo.hasOpener, serviceInfo.jacheongbiId, serviceInfo.jacheongbiPw,
            serviceInfo.useSugarService, serviceInfo.sugarMeterInfo, serviceInfo.useSensorService, serviceInfo.sensorInfo,
            corporateFarmDetails?.year, corporateFarmDetails?.consultationDate || null, corporateFarmDetails?.estimatedQuantity, corporateFarmDetails?.contractedQuantity, corporateFarmDetails?.isContracted,
            corporateFarmDetails?.specialNotes, corporateFarmDetails?.contractDate || null, corporateFarmDetails?.downPayment, corporateFarmDetails?.balanceDueDate || null, corporateFarmDetails?.balancePayment, corporateFarmDetails?.mulchingWorkDate || null
        ]);

        // 업데이트를 위해 기존의 관련 데이터를 모두 삭제합니다.
        await Promise.all([
            client.query('DELETE FROM support_programs WHERE farm_id = $1', [id]),
            client.query('DELETE FROM annual_data WHERE farm_id = $1', [id]),
            client.query('DELETE FROM consultation_logs WHERE farm_id = $1', [id])
        ]);

        // 새로운 관련 데이터를 삽입합니다.
        for (const p of supportPrograms) {
            await client.query('INSERT INTO support_programs (id, farm_id, year, project_name, project_description, local_govt_fund, self_fund, is_selected) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                [p.id, id, p.year, p.projectName, p.projectDescription, p.localGovtFund, p.selfFund, p.isSelected]);
        }
        for (const d of annualData) {
            await client.query('INSERT INTO annual_data (id, farm_id, year, avg_brix, has_alternate_bearing, estimated_yield, price_per_gwan, shipping_season, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                [d.id, id, d.year, d.avgBrix, d.hasAlternateBearing, d.estimatedYield, d.pricePerGwan, d.shippingSeason, d.notes]);
        }
        if (corporateFarmDetails) {
            for (const log of corporateFarmDetails.consultationLogs) {
                await client.query('INSERT INTO consultation_logs (id, farm_id, date, category, content, notes) VALUES ($1, $2, $3, $4, $5, $6)',
                    [log.id, id, log.date, log.category, log.content, log.notes]);
            }
        }
        
        // 모든 작업이 성공하면 트랜잭션을 커밋합니다.
        await client.query('COMMIT');
        return farm;
    } catch (e) {
        // 오류 발생 시 모든 변경사항을 롤백합니다.
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

// 농가 데이터를 ID로 삭제
export const deleteFarm = async (farmId: string): Promise<void> => {
    const client = await pool.connect();
    try {
        // farms 테이블의 farm_id에 ON DELETE CASCADE가 설정되어 있어,
        // farms에서만 삭제해도 관련된 모든 자식 테이블의 데이터가 자동으로 삭제됩니다.
        await client.query('DELETE FROM farms WHERE id = $1', [farmId]);
    } finally {
        client.release();
    }
};

// 모든 농가 데이터를 복원 데이터로 교체
export const restoreFarms = async (farms: Farm[]): Promise<void> => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // 데이터 무결성을 위해 자식 테이블부터 삭제 후 부모 테이블 삭제
        await client.query('TRUNCATE support_programs, annual_data, consultation_logs, farms RESTART IDENTITY');
        
        for (const farm of farms) {
           await saveFarmInTransaction(farm, client);
        }

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
};

// 복원 로직 내에서 사용할 트랜잭션용 저장 함수 (ON CONFLICT 없음)
const saveFarmInTransaction = async (farm: Farm, client: PoolClient): Promise<void> => {
    const { id, basicInfo, facilityInfo, serviceInfo, corporateFarmDetails, supportPrograms, annualData } = farm;
    const insertFarmQuery = `
        INSERT INTO farms (
            id, name, contact, address, area_pyeong, cultivar, tree_count, is_corporate,
            slope, planting_distance, has_covering, covering_type, has_power, has_internet, has_umbrella_system,
            has_drip_hose, has_sprinkler, has_windbreak, has_opener, jacheongbi_id, jacheongbi_pw,
            use_sugar_service, sugar_meter_info, use_sensor_service, sensor_info,
            corporate_year, consultation_date, estimated_quantity, contracted_quantity, is_contracted,
            special_notes, contract_date, down_payment, balance_due_date, balance_payment, mulching_work_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36);
    `;
    await client.query(insertFarmQuery, [
        id, basicInfo.name, basicInfo.contact, basicInfo.address, basicInfo.areaPyeong, basicInfo.cultivar, basicInfo.treeCount, basicInfo.isCorporate,
        facilityInfo.slope, facilityInfo.plantingDistance, facilityInfo.hasCovering, facilityInfo.coveringType || null, facilityInfo.hasPower, facilityInfo.hasInternet, facilityInfo.hasUmbrellaSystem,
        facilityInfo.hasDripHose, facilityInfo.hasSprinkler, facilityInfo.hasWindbreak, facilityInfo.hasOpener, serviceInfo.jacheongbiId, serviceInfo.jacheongbiPw,
        serviceInfo.useSugarService, serviceInfo.sugarMeterInfo, serviceInfo.useSensorService, serviceInfo.sensorInfo,
        corporateFarmDetails?.year, corporateFarmDetails?.consultationDate || null, corporateFarmDetails?.estimatedQuantity, corporateFarmDetails?.contractedQuantity, corporateFarmDetails?.isContracted,
        corporateFarmDetails?.specialNotes, corporateFarmDetails?.contractDate || null, corporateFarmDetails?.downPayment, corporateFarmDetails?.balanceDueDate || null, corporateFarmDetails?.balancePayment, corporateFarmDetails?.mulchingWorkDate || null
    ]);

    for (const p of supportPrograms) {
        await client.query('INSERT INTO support_programs (id, farm_id, year, project_name, project_description, local_govt_fund, self_fund, is_selected) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
            [p.id, id, p.year, p.projectName, p.projectDescription, p.localGovtFund, p.selfFund, p.isSelected]);
    }
    for (const d of annualData) {
        await client.query('INSERT INTO annual_data (id, farm_id, year, avg_brix, has_alternate_bearing, estimated_yield, price_per_gwan, shipping_season, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [d.id, id, d.year, d.avgBrix, d.hasAlternateBearing, d.estimatedYield, d.pricePerGwan, d.shippingSeason, d.notes]);
    }
    if (corporateFarmDetails) {
        for (const log of corporateFarmDetails.consultationLogs) {
            await client.query('INSERT INTO consultation_logs (id, farm_id, date, category, content, notes) VALUES ($1, $2, $3, $4, $5, $6)',
                [log.id, id, log.date, log.category, log.content, log.notes]);
        }
    }
};

import { Farm } from '@/types';

const API_BASE_URL = '/api/farms';

type FarmsResponse = {
    farms: Farm[];
    totalPages: number;
};

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || '알 수 없는 서버 오류가 발생했습니다.');
    }
    return response.json();
};

export const farmApi = {
    getAllFarms: async (page: number = 1, limit: number = 10): Promise<FarmsResponse> => {
        const response = await fetch(`${API_BASE_URL}?page=${page}&limit=${limit}`);
        return handleResponse(response);
    },

    saveFarm: async (farmData: Farm): Promise<Farm> => {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(farmData),
        });
        return handleResponse(response);
    },

    deleteFarm: async (farmId: string): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/${farmId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || '삭제 중 오류가 발생했습니다.');
        }
    },

    replaceAllFarms: async (newFarms: Farm[]): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/restore`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newFarms),
        });
        if (!response.ok) {
             const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || '데이터 복원 중 오류가 발생했습니다.');
        }
    }
};

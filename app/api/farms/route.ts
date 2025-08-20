import { NextResponse, NextRequest } from 'next/server';
import { getFarms, saveFarm } from '@/lib/db';
import { Farm } from '@/types';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '10', 10);

        const { farms, totalPages } = await getFarms(page, limit);
        return NextResponse.json({ farms, totalPages });
    } catch (error) {
        console.error('API GET Error:', error);
        return NextResponse.json({ message: '데이터를 가져오는 데 실패했습니다.' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const farmData: Farm = await request.json();
        // 데이터 유효성 검사 추가 (예시)
        if (!farmData.basicInfo.name || !farmData.id) {
             return NextResponse.json({ message: '필수 데이터(농가명, ID)가 누락되었습니다.' }, { status: 400 });
        }
        const savedFarm = await saveFarm(farmData);
        return NextResponse.json(savedFarm, { status: 201 });
    } catch (error) {
        console.error('API POST Error:', error);
        // @ts-ignore
        if (error.code === '23505') { // Unique constraint violation
             return NextResponse.json({ message: '이미 존재하는 ID입니다.' }, { status: 409 });
        }
        return NextResponse.json({ message: '데이터를 저장하는 데 실패했습니다.' }, { status: 500 });
    }
}

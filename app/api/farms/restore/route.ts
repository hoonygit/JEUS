
import { NextResponse } from 'next/server';
import { restoreFarms } from '@/lib/db';
import { Farm } from '@/types';

export async function POST(request: Request) {
    try {
        const farmsData: Farm[] = await request.json();
        if (!Array.isArray(farmsData)) {
            return NextResponse.json({ message: '잘못된 데이터 형식입니다. 배열이 필요합니다.' }, { status: 400 });
        }
        await restoreFarms(farmsData);
        return NextResponse.json({ message: '데이터 복원이 완료되었습니다.' }, { status: 200 });
    } catch (error) {
        console.error('API Restore Error:', error);
        return NextResponse.json({ message: '데이터를 복원하는 데 실패했습니다.' }, { status: 500 });
    }
}

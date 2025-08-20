
import { NextResponse } from 'next/server';
import { deleteFarm } from '@/lib/db';

type RouteParams = {
    params: {
        id: string
    }
}

export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { id } = params;
        if (!id) {
            return NextResponse.json({ message: '농가 ID가 필요합니다.' }, { status: 400 });
        }
        await deleteFarm(id);
        return new NextResponse(null, { status: 204 }); // No Content
    } catch (error) {
        console.error('API DELETE Error:', error);
        return NextResponse.json({ message: '데이터를 삭제하는 데 실패했습니다.' }, { status: 500 });
    }
}

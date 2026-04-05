// Next.js
import { NextRequest, NextResponse } from 'next/server';

// Utils
import { sendEmail } from '@/utils/sendEmail';

const POST = async (req: NextRequest) => {
  try {
    const data = await req.json();

    // Basic validation
    if (!data.type) {
      return NextResponse.json({ error: 'Missing type' }, { status: 400 });
    }

    if (data.type === 'artist') {
      if (!data.artistA || !data.artistB) {
        return NextResponse.json(
          { error: 'Missing artist fields' },
          { status: 400 },
        );
      }
    }

    if (data.type === 'album') {
      if (!data.artist || !data.albumA || !data.albumB) {
        return NextResponse.json(
          { error: 'Missing album fields' },
          { status: 400 },
        );
      }
    }

    // SEND THE EMAIL!
    await sendEmail(data);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
};

export { POST };

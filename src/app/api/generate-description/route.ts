import { generateMultilangDescriptions } from "@/lib/googleClient";
import { NextResponse } from "next/server";

export async function POST(req: Request) {

  try {
    const { videoUrl, languages } = await req.json();

    if (!videoUrl || !languages) {
      return NextResponse.json(
        { error: "Debes enviar videoUrl y languages" },
        { status: 400 }
      );
    }

    const results = await generateMultilangDescriptions(videoUrl, languages);

    return NextResponse.json({ files: results });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json(
      { error: (err as Error).message || "Error interno del servidor" },
      { status: 500 }
    );
  }
};

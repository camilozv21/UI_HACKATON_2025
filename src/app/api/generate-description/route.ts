import { auth } from "@/auth";
import { generateMultilangDescriptions } from "@/lib/googleClient";
import { NextAuthRequest } from "next-auth";
import { NextResponse } from "next/server";

export const POST = auth(async (req: NextAuthRequest) => {
  const session = req.auth;

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

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
});

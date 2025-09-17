
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const fileUrl = searchParams.get("url");

  if (!fileUrl) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  try {
    // Descargamos el archivo desde GCS con la URL firmada
    const res = await fetch(fileUrl);
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch file" }, { status: 500 });
    }

    const arrayBuffer = await res.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "text/vtt",
        "Content-Disposition": "inline",
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Unexpected error" + (err instanceof Error ? `: ${err.message}` : "") }, { status: 500 });
  }
}

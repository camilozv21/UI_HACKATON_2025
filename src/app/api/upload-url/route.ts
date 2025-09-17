import { NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";

const rawKey = process.env.GCP_KEY;
const bucketName = process.env.BUCKET_NAME || "";

if (!rawKey) throw new Error("Falta la credencial de Google en GCP_KEY");

const credentials = JSON.parse(rawKey);

const storage = new Storage({
  projectId: credentials.project_id,
  credentials,
});

export async function POST(req: Request) {
  try {
    const { filename, contentType } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: "Missing filename or contentType" }, { status: 400 });
    }

    const destination = `upload/${Date.now()}-${filename}`;
    const [url] = await storage
      .bucket(bucketName)
      .file(destination)
      .getSignedUrl({
        version: "v4",
        action: "write",
        expires: Date.now() + 60 * 60 * 1000, // 1 hour
        contentType: contentType,
      });

    const signedReadUrl = await storage
      .bucket(bucketName)
      .file(destination)
      .getSignedUrl({
        version: "v4",
        action: "read",
        expires: Date.now() + 60 * 60 * 1000, // 1 hour
      });

    const gsUrl = `gs://${bucketName}/${destination}`;

    return NextResponse.json({ uploadUrl: url, gsUrl, signedReadUrl });
  } catch (err: unknown) {
    console.error("Error creando signed URL:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

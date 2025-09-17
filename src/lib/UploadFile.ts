import { Storage } from "@google-cloud/storage";

const rawKey = process.env.GCP_KEY;
const bucketName = "videos-uploaded-industry";

if (!rawKey) {
  throw new Error("Falta la credencial de Google en GCP_KEY");
}

const credentials = JSON.parse(rawKey);

const storage = new Storage({
  projectId: credentials.project_id,
  credentials,
});

export async function getSignedUrl(bucketName: string, fileName: string) {
  const [url] = await storage
    .bucket(bucketName)
    .file(fileName)
    .getSignedUrl({
      action: "read",
      expires: Date.now() + 60 * 60 * 2000,
    });

  return url;
}


export async function uploadFileToBucket(
  file: File
): Promise<{ publicUrl: string; gsUrl: string }> {
  const bucket = storage.bucket(bucketName);

  const destination = `upload/${Date.now()}-${file.name}`;
  const blob = bucket.file(destination);

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await blob.save(buffer, {
    contentType: file.type,
    resumable: false,
  });

  // Generamos URL firmada
  const publicUrl = await getSignedUrl(bucketName, destination);

  // Generamos URL de gs
  const gsUrl = `gs://${bucketName}/${destination}`;

  return { publicUrl, gsUrl };
}

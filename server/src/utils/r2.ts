import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import crypto from "crypto";
import { env } from "../config/env";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${env.r2AccountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.r2AccessKeyId,
    secretAccessKey: env.r2SecretAccessKey,
  },
});

export async function uploadImageToR2(buffer: Buffer, mimetype: string, originalname: string): Promise<string> {
  const ext = path.extname(originalname);
  const key = `${crypto.randomUUID()}${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: env.r2BucketName,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    })
  );

  return `${env.r2PublicUrl}/${key}`;
}

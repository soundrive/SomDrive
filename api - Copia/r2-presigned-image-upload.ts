import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export default async function handler(req: any, res: any) {
  // 1. Accept only POST method
  if (req.method !== 'POST') {
    console.error(`Method ${req.method} is not allowed on /api/r2-presigned-image-upload`);
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Método ${req.method} não suportado. Use POST.` });
  }

  try {
    const { fileType, fileSize, userId } = req.body || {};
    const fileName = req.body?.fileName || req.body?.filename;

    console.log("Image Upload Request details:", {
      fileName,
      fileType,
      fileSize,
      userId
    });

    // Validate parameters
    if (!fileName || !fileType || fileSize === undefined || !userId) {
      const errMsg = "Parâmetros obrigatórios ausentes no body: fileName, fileType, fileSize e userId.";
      console.error("Validation Error:", errMsg, "Received:", req.body);
      return res.status(400).json({ error: errMsg });
    }

    // 1. Validate image format (jpeg, png, webp)
    const mimeLower = fileType.toLowerCase();
    const nameLower = fileName.toLowerCase();
    const isAcceptedMime = mimeLower === "image/jpeg" || mimeLower === "image/jpg" || mimeLower === "image/png" || mimeLower === "image/webp";
    const isAcceptedExt = nameLower.endsWith(".jpeg") || nameLower.endsWith(".jpg") || nameLower.endsWith(".png") || nameLower.endsWith(".webp");

    if (!isAcceptedMime && !isAcceptedExt) {
      const errMsg = "Formato de arquivo inválido. Apenas imagens nos formatos JPEG, PNG e WEBP são permitidas.";
      console.error("Format Validation Error:", { fileName, fileType });
      return res.status(400).json({ error: errMsg });
    }

    // 2. Validate maximum file size <= 2 MB (2 * 1024 * 1024)
    const maxSizeBytes = 2 * 1024 * 1024;
    if (fileSize > maxSizeBytes) {
      const formattedSize = (fileSize / (1024 * 1024)).toFixed(2);
      const errMsg = `Esta imagem possui ${formattedSize} MB, ultrapassando o limite máximo permitido de 2 MB.`;
      console.error("Size Validation Error:", { fileSize, limit: maxSizeBytes });
      return res.status(400).json({ error: errMsg });
    }

    // 3. Retrieve Cloudflare R2 environment variables
    const rawAccountId = process.env.R2_ACCOUNT_ID;
    const rawBucketName = process.env.R2_BUCKET_NAME;
    const rawAccessKeyId = process.env.R2_ACCESS_KEY_ID;
    const rawSecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const rawPublicBaseUrl = process.env.R2_PUBLIC_BASE_URL;

    const missingEnvVars: string[] = [];
    if (!rawAccountId) missingEnvVars.push("R2_ACCOUNT_ID");
    if (!rawAccessKeyId) missingEnvVars.push("R2_ACCESS_KEY_ID");
    if (!rawSecretAccessKey) missingEnvVars.push("R2_SECRET_ACCESS_KEY");
    if (!rawBucketName) missingEnvVars.push("R2_BUCKET_NAME");
    if (!rawPublicBaseUrl) missingEnvVars.push("R2_PUBLIC_BASE_URL");

    if (missingEnvVars.length > 0) {
      const errMsg = `Configuração do Cloudflare R2 incompleta. Faltam as variáveis: ${missingEnvVars.join(", ")}`;
      console.error("R2 Config Error:", errMsg);
      return res.status(500).json({ error: errMsg });
    }

    // Clean env vars (stripping protocols details or trailing slashes)
    const cleanId = (id: string): string => {
      let val = id.trim();
      const hexMatch = val.match(/\b([a-fA-F0-9]{32})\b/);
      if (hexMatch) return hexMatch[1];
      val = val.replace(/^https?:\/\//i, "");
      val = val.split("/")[0];
      val = val.split(".")[0];
      return val;
    };

    const R2_ACCOUNT_ID = cleanId(rawAccountId!);
    const R2_BUCKET_NAME = (rawBucketName!.includes("=") ? rawBucketName!.split("=")[1] : rawBucketName!)
      .trim()
      .replace(/^['"]|['"]$/g, "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const R2_ACCESS_KEY_ID = rawAccessKeyId!.trim();
    const R2_SECRET_ACCESS_KEY = rawSecretAccessKey!.trim();
    const R2_PUBLIC_BASE_URL = rawPublicBaseUrl!.trim();

    // 4. Create safe, clean storagePath
    const timestamp = Date.now();
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.]/g, "_");
    const storagePath = `users/${userId}/avatar/${timestamp}-${safeFileName}`;

    // 5. Initialize R2-compatible S3Client
    const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    console.log("R2 Endpoint:", endpoint);

    const s3 = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });

    // 6. Generate sign url
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: storagePath,
      ContentType: fileType || "image/jpeg",
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    // 7. Formulate public image URL
    const baseSlash = R2_PUBLIC_BASE_URL.endsWith("/") ? R2_PUBLIC_BASE_URL.slice(0, -1) : R2_PUBLIC_BASE_URL;
    const publicImageUrl = `${baseSlash}/${storagePath}`;

    console.log("R2 Presigned image upload URL generated successfully:", {
      storagePath,
      publicImageUrl
    });

    return res.status(200).json({
      uploadUrl,
      storagePath,
      publicImageUrl
    });

  } catch (error: any) {
    console.error("Critical error inside r2-presigned-image-upload API:", error);
    return res.status(500).json({
      error: `Erro interno ao gerar uploadUrl de imagem: ${error?.message || String(error)}`
    });
  }
}

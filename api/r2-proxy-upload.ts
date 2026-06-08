import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Disable default bodyParser to allow streaming raw binaries
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to buffer stream contents
function getBuffer(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    req.on('data', (chunk: any) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', (err: any) => reject(err));
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Método ${req.method} não suportado. Use POST.` });
  }

  try {
    const fileName = req.headers["x-file-name"] ? decodeURIComponent(req.headers["x-file-name"] as string) : undefined;
    const fileType = req.headers["x-file-type"] as string;
    const fileSizeStr = req.headers["x-file-size"] as string;
    const userId = req.headers["x-user-id"] as string;
    const songId = req.headers["x-song-id"] as string;
    const fileSize = fileSizeStr ? parseInt(fileSizeStr, 10) : undefined;

    console.log("Serverless Proxy - Recebido upload:", {
      fileName,
      fileType,
      fileSize,
      userId,
      songId
    });

    if (!fileName || !fileType || fileSize === undefined || !userId || !songId) {
      return res.status(400).json({ error: "Parâmetros obrigatórios ausentes nos headers: x-file-name, x-file-type, x-file-size, x-user-id e x-song-id." });
    }

    // 1. Validar se o arquivo é MP3 (Extensão ou Mimetype)
    const mimeLower = fileType.toLowerCase();
    const nameLower = fileName.toLowerCase();
    const isMp3Mime = mimeLower === "audio/mpeg" || mimeLower === "audio/mp3" || mimeLower === "audio/x-mpeg" || mimeLower === "audio/x-mp3" || mimeLower === "audio/mpeg3";
    const isMp3Ext = nameLower.endsWith(".mp3");
    
    if (!isMp3Mime && !isMp3Ext) {
      return res.status(400).json({ error: "Este arquivo não é um MP3 válido. Por favor, converta sua música para formato MP3 (.mp3) e tente novamente." });
    }

    // 2. Validar Tamanho Máximo <= 20 MB (20 * 1024 * 1024)
    const maxSizeBytes = 20 * 1024 * 1024;
    if (fileSize > maxSizeBytes) {
      return res.status(400).json({ error: `Este arquivo MP3 possui ${(fileSize / (1024 * 1024)).toFixed(2)} MB, ultrapassando o limite de 20 MB.` });
    }

    // 3. Validar variáveis de ambiente essenciais do Cloudflare R2
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
      return res.status(550).json({ error: `Configuração do Cloudflare R2 incompleta. Faltam as variáveis: ${missingEnvVars.join(", ")}` });
    }

    // Limpar variáveis de ambiente
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
    const R2_BUCKET_NAME = rawBucketName!.trim();
    const R2_ACCESS_KEY_ID = rawAccessKeyId!.trim();
    const R2_SECRET_ACCESS_KEY = rawSecretAccessKey!.trim();
    const R2_PUBLIC_BASE_URL = rawPublicBaseUrl!.trim();

    // 4. Criar storagePath seguro
    const timestamp = Date.now();
    const cleanName = fileName.replace(/[^a-zA-Z0-9.]/g, "_");
    const baseName = cleanName.endsWith(".mp3") ? cleanName : `${cleanName}.mp3`;
    const storagePath = `users/${userId}/songs/${songId}/${timestamp}-${baseName}`;

    // 5. Inicializar o cliente S3 compatível com Cloudflare R2
    const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const s3 = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });

    // 6. Ler o stream de upload
    const fileBuffer = await getBuffer(req);

    if (fileBuffer.length === 0) {
      return res.status(400).json({ error: "Arquivo binário de áudio enviado está vazio." });
    }

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: storagePath,
      Body: fileBuffer,
      ContentType: fileType || "audio/mpeg",
    });

    await s3.send(command);

    const baseSlash = R2_PUBLIC_BASE_URL.endsWith("/") ? R2_PUBLIC_BASE_URL.slice(0, -1) : R2_PUBLIC_BASE_URL;
    const publicAudioUrl = `${baseSlash}/${storagePath}`;

    return res.status(200).json({
      storagePath,
      publicAudioUrl
    });

  } catch (error: any) {
    console.error("Erro Crítico no r2-proxy-upload serverless:", error);
    return res.status(500).json({ 
      error: `Erro interno no proxy upload: ${error?.message || String(error)}` 
    });
  }
}

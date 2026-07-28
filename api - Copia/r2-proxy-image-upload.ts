import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Disable default bodyParser to allow streaming raw binaries safely
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

  const fileName = req.headers["x-file-name"] ? decodeURIComponent(req.headers["x-file-name"] as string) : undefined;
  const fileType = req.headers["x-file-type"] as string;
  const fileSizeStr = req.headers["x-file-size"] as string;
  const userId = req.headers["x-user-id"] as string;
  const fileSize = fileSizeStr ? parseInt(fileSizeStr, 10) : undefined;

  try {
    console.log("Serverless Proxy Image Upload - Recebido:", {
      fileName,
      fileType,
      fileSize,
      userId
    });

    if (!fileName || !fileType || fileSize === undefined || !userId) {
      const errMsg = "Parâmetros obrigatórios ausentes nos headers: x-file-name, x-file-type, x-file-size, x-user-id.";
      console.error("CORS Proxy Image - Erro de Validação:", errMsg);
      return res.status(400).json({ error: errMsg });
    }

    // 1. Validar formato de imagem (JPEG, PNG, WEBP)
    const mimeLower = fileType.toLowerCase();
    const nameLower = fileName.toLowerCase();
    const isAcceptedMime = mimeLower === "image/jpeg" || mimeLower === "image/jpg" || mimeLower === "image/png" || mimeLower === "image/webp";
    const isAcceptedExt = nameLower.endsWith(".jpeg") || nameLower.endsWith(".jpg") || nameLower.endsWith(".png") || nameLower.endsWith(".webp");

    if (!isAcceptedMime && !isAcceptedExt) {
      const errMsg = "Formato de arquivo inválido. Apenas imagens nos formatos JPEG, PNG e WEBP são permitidas.";
      console.error("CORS Proxy Image - Erro Formato:", { fileName, fileType });
      return res.status(400).json({ error: errMsg });
    }

    // 2. Validar tamanho máximo <= 2 MB
    const maxSizeBytes = 2 * 1024 * 1024;
    if (fileSize > maxSizeBytes) {
      const errMsg = `Esta imagem possui ${(fileSize / (1024 * 1024)).toFixed(2)} MB, ultrapassando o limite limite de 2 MB.`;
      console.error("CORS Proxy Image - Erro Tamanho:", { fileSize, limit: maxSizeBytes });
      return res.status(400).json({ error: errMsg });
    }

    // 3. Validar variáveis de ambiente R2
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
      const errMsg = `Configuração do Cloudflare R2 incompleta no servidor proxy. Faltam: ${missingEnvVars.join(", ")}`;
      console.error("CORS Proxy Image - Erro Ambientes:", errMsg);
      return res.status(500).json({ error: errMsg });
    }

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

    // 4. Criar storagePath no padrão users/{userId}/avatar/{timestamp}-{safeFileName}
    const timestamp = Date.now();
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.]/g, "_");
    const storagePath = `users/${userId}/avatar/${timestamp}-${safeFileName}`;

    // 5. Inicializar S3Client compatível
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

    // 6. Obter buffer binário
    const fileBuffer = await getBuffer(req);
    if (!fileBuffer || fileBuffer.length === 0) {
      const errMsg = "Arquivo enviado de imagem está vazio.";
      console.error("CORS Proxy Image - Erro Buffer Vazio:", { userId });
      return res.status(400).json({ error: errMsg });
    }

    // 7. Enviar via PutObjectCommand
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: storagePath,
      Body: fileBuffer,
      ContentType: fileType || "image/jpeg",
    });

    await s3.send(command);

    const baseSlash = R2_PUBLIC_BASE_URL.endsWith("/") ? R2_PUBLIC_BASE_URL.slice(0, -1) : R2_PUBLIC_BASE_URL;
    const publicImageUrl = `${baseSlash}/${storagePath}`;

    console.log("CORS Proxy Image Upload - Concluído com sucesso:", {
      storagePath,
      publicImageUrl
    });

    return res.status(200).json({
      storagePath,
      publicImageUrl
    });

  } catch (error: any) {
    console.error("Critical error in r2-proxy-image-upload:", {
      error: error?.message || String(error),
      userId,
      file: {
        name: fileName,
        type: fileType,
        size: fileSize
      }
    });
    return res.status(500).json({
      error: `Erro ao fazer upload da imagem no endpoint proxy: ${error?.message || String(error)}`
    });
  }
}

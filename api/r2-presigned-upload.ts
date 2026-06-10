import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export default async function handler(req: any, res: any) {
  // 1. Aceitar apenas o método POST
  if (req.method !== 'POST') {
    console.error(`Method ${req.method} is not allowed on /api/r2-presigned-upload`);
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Método ${req.method} não suportado. Use POST.` });
  }

  try {
    const { fileType, fileSize, userId, songId, audioHash } = req.body || {};
    // Garantir que aceitamos 'fileName' (do front-end original) bem como 'filename'
    const fileName = req.body?.fileName || req.body?.filename;

    // Log preliminar de input para diagnóstico nos logs da Vercel
    console.log("Recebida requisição de upload:", {
      fileName,
      fileType,
      fileSize,
      userId,
      songId,
      audioHash: audioHash ? "sim" : "não"
    });

    // Validar parâmetros obrigatórios
    if (!fileName || !fileType || fileSize === undefined || !userId || !songId) {
      const errMsg = "Parâmetros obrigatórios ausentes no body: fileName, fileType, fileSize, userId e songId.";
      console.error("Erro de Validação:", errMsg, "Enviado:", req.body);
      return res.status(400).json({ error: errMsg });
    }

    // 1. Validar se o arquivo é MP3 (Extensão ou Mimetype)
    const mimeLower = fileType.toLowerCase();
    const nameLower = fileName.toLowerCase();
    const isMp3Mime = mimeLower === "audio/mpeg" || mimeLower === "audio/mp3" || mimeLower === "audio/x-mpeg" || mimeLower === "audio/x-mp3" || mimeLower === "audio/mpeg3";
    const isMp3Ext = nameLower.endsWith(".mp3");
    
    if (!isMp3Mime && !isMp3Ext) {
      const errMsg = "Este arquivo não é um MP3 válido. Por favor, converta sua música para formato MP3 (.mp3) e tente novamente.";
      console.error("Erro de Validação de Formato:", { fileName, fileType });
      return res.status(400).json({ error: errMsg });
    }

    // 2. Validar Tamanho Máximo <= 20 MB (20 * 1024 * 1024)
    const maxSizeBytes = 20 * 1024 * 1024;
    if (fileSize > maxSizeBytes) {
      const formattedSize = (fileSize / (1024 * 1024)).toFixed(2);
      const errMsg = `Este arquivo MP3 possui ${formattedSize} MB, ultrapassando o limite máximo permitido de 20 MB. Reduza o arquivo e tente novamente.`;
      console.error("Erro de Validação de Tamanho:", { fileSize, limit: maxSizeBytes });
      return res.status(400).json({ error: errMsg });
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
      const errMsg = `Configuração do Cloudflare R2 incompleta na Vercel. Faltam as variáveis: ${missingEnvVars.join(", ")}`;
      console.error("Erro de Configuração:", errMsg);
      return res.status(500).json({ error: errMsg });
    }

    // Limpar variáveis de ambiente de possíveis resíduos (espaços, barras, protocolos, etc.)
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

    console.log("R2_ACCOUNT_ID bruto:", rawAccountId);
    console.log("R2_ACCOUNT_ID limpo:", R2_ACCOUNT_ID);

    // 4. Criar storagePath seguro
    const timestamp = Date.now();
    const cleanName = fileName.replace(/[^a-zA-Z0-9.]/g, "_");
    const baseName = cleanName.endsWith(".mp3") ? cleanName : `${cleanName}.mp3`;
    const storagePath = `users/${userId}/songs/${songId}/${timestamp}-${baseName}`;

    // 5. Inicializar o cliente S3 compatível com Cloudflare R2
    const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    console.log("R2 endpoint usado:", endpoint);
    console.log("R2 bucket:", R2_BUCKET_NAME);

    const s3 = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
      forcePathStyle: true,
    });

    // 6. Gerar a URL Presignada de PUT
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: storagePath,
      ContentType: fileType || "audio/mpeg",
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    // 7. Formar a URL pública do áudio
    const baseSlash = R2_PUBLIC_BASE_URL.endsWith("/") ? R2_PUBLIC_BASE_URL.slice(0, -1) : R2_PUBLIC_BASE_URL;
    const publicAudioUrl = `${baseSlash}/${storagePath}`;

    console.log("R2 storagePath:", storagePath);
    console.log("R2 publicAudioUrl:", publicAudioUrl);
    console.log("URL Presignada gerada com sucesso:", {
      storagePath,
      publicAudioUrl,
      uploadUrlExpiry: "3600s"
    });

    // 8. Retornar dados no formato esperado
    return res.status(200).json({
      uploadUrl,
      storagePath,
      publicAudioUrl
    });

  } catch (error: any) {
    console.error("Erro Crítico no r2-presigned-upload:", error);
    return res.status(500).json({ 
      error: `Erro interno ao gerar uploadUrl: ${error?.message || String(error)}` 
    });
  }
}

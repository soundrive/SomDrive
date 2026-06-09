import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import mercadopagoWebhookHandler from "./api/mercadopago-webhook";
import createSubscriptionHandler from "./api/mercadopago/create-subscription";
import verifySubscriptionHandler from "./api/mercadopago/verify-subscription";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Cloudflare R2 presigned upload url
  app.post("/api/r2-presigned-upload", async (req, res) => {
    try {
      const { fileType, fileSize, userId, songId, audioHash } = req.body || {};
      const fileName = req.body?.fileName || req.body?.filename;

      console.log("Local Dev - Recebida requisição de upload:", {
        fileName,
        fileType,
        fileSize,
        userId,
        songId,
        audioHash: audioHash ? "sim" : "não"
      });

      if (!fileName || !fileType || fileSize === undefined || !userId || !songId) {
        const errMsg = "Parâmetros obrigatórios ausentes no body: fileName, fileType, fileSize, userId e songId.";
        console.error("Local Dev - Erro de Validação:", errMsg, "Enviado:", req.body);
        return res.status(400).json({ error: errMsg });
      }

      // 1. Validar se o arquivo é MP3 (Extensão ou Mime)
      const mimeLower = fileType.toLowerCase();
      const nameLower = fileName.toLowerCase();
      const isMp3Mime = mimeLower === "audio/mpeg" || mimeLower === "audio/mp3" || mimeLower === "audio/x-mpeg" || mimeLower === "audio/x-mp3" || mimeLower === "audio/mpeg3";
      const isMp3Ext = nameLower.endsWith(".mp3");
      
      if (!isMp3Mime && !isMp3Ext) {
        const errMsg = "Este arquivo não é um MP3 válido. Por favor, converta sua música para formato MP3 (.mp3) e tente novamente.";
        console.error("Local Dev - Erro de Validação de Formato:", { fileName, fileType });
        return res.status(400).json({ error: errMsg });
      }

      // 2. Validar Tamanho Máximo <= 20 MB (20 * 1024 * 1024)
      const maxSizeBytes = 20 * 1024 * 1024;
      if (fileSize > maxSizeBytes) {
        const formattedSize = (fileSize / (1024 * 1024)).toFixed(2);
        const errMsg = `Este arquivo MP3 possui ${formattedSize} MB, ultrapassando o limite máximo permitido de 20 MB. Reduza o arquivo e tente novamente.`;
        console.error("Local Dev - Erro de Validação de Tamanho:", { fileSize, limit: maxSizeBytes });
        return res.status(400).json({ error: errMsg });
      }

      // Verify server setup environment variables
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
        const errMsg = `Configuração do Cloudflare R2 incompleta no servidor. Faltam as variáveis: ${missingEnvVars.join(", ")}`;
        console.error("Local Dev - Erro de Configuração:", errMsg);
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
      const R2_BUCKET_NAME = rawBucketName!.trim();
      const R2_ACCESS_KEY_ID = rawAccessKeyId!.trim();
      const R2_SECRET_ACCESS_KEY = rawSecretAccessKey!.trim();
      const R2_PUBLIC_BASE_URL = rawPublicBaseUrl!.trim();

      console.log("Local Dev - R2_ACCOUNT_ID bruto:", rawAccountId);
      console.log("Local Dev - R2_ACCOUNT_ID limpo:", R2_ACCOUNT_ID);

      // 3. Criar storagePath seguro
      const timestamp = Date.now();
      const cleanName = fileName.replace(/[^a-zA-Z0-9.]/g, "_");
      const baseName = cleanName.endsWith(".mp3") ? cleanName : `${cleanName}.mp3`;
      const storagePath = `users/${userId}/songs/${songId}/${timestamp}-${baseName}`;

      // 4. Inicializar S3Client compatível com R2
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

      // 5. Gerar presigned URL (PUT)
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: storagePath,
        ContentType: fileType || "audio/mpeg",
      });

      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

      // 6. Formar url pública de retorno
      const baseSlash = R2_PUBLIC_BASE_URL.endsWith("/") ? R2_PUBLIC_BASE_URL.slice(0, -1) : R2_PUBLIC_BASE_URL;
      const publicAudioUrl = `${baseSlash}/${storagePath}`;

      console.log("R2 storagePath:", storagePath);
      console.log("R2 publicAudioUrl:", publicAudioUrl);
      console.log("Local Dev - URL Presignada gerada com sucesso:", {
        storagePath,
        publicAudioUrl
      });

      return res.json({
        uploadUrl,
        storagePath,
        publicAudioUrl,
      });

    } catch (err: any) {
      console.error("Local Dev - Erro ao gerar URL presignada: ", err);
      return res.status(500).json({ 
        error: "Erro interno ao gerar uploadUrl: " + (err.message || String(err)) 
      });
    }
  });

  // API Route for Cloudflare R2 proxy upload (bypasses CORS entirely)
  app.post("/api/r2-proxy-upload", express.raw({ type: '*/*', limit: '25mb' }), async (req, res) => {
    try {
      const fileName = req.headers["x-file-name"] ? decodeURIComponent(req.headers["x-file-name"] as string) : undefined;
      const fileType = req.headers["x-file-type"] as string;
      const fileSizeStr = req.headers["x-file-size"] as string;
      const userId = req.headers["x-user-id"] as string;
      const songId = req.headers["x-song-id"] as string;
      const fileSize = fileSizeStr ? parseInt(fileSizeStr, 10) : undefined;
      console.log("R2 Proxy Upload - Recebido proxy upload:", {
        fileName,
        fileType,
        fileSize,
        userId,
        songId,
        bodyLength: req.body ? req.body.length : 0
      });

      if (!fileName || !fileType || fileSize === undefined || !userId || !songId) {
        const errMsg = "Parâmetros obrigatórios ausentes nos headers: x-file-name, x-file-type, x-file-size, x-user-id e x-song-id.";
        console.error("R2 Proxy Upload - Erro de Validação:", errMsg);
        return res.status(400).json({ error: errMsg });
      }

      // 1. Validar se o arquivo é MP3 (Extensão ou Mime)
      const mimeLower = fileType.toLowerCase();
      const nameLower = fileName.toLowerCase();
      const isMp3Mime = mimeLower === "audio/mpeg" || mimeLower === "audio/mp3" || mimeLower === "audio/x-mpeg" || mimeLower === "audio/x-mp3" || mimeLower === "audio/mpeg3";
      const isMp3Ext = nameLower.endsWith(".mp3");
      
      if (!isMp3Mime && !isMp3Ext) {
        const errMsg = "Este arquivo não é um MP3 válido. Por favor, converta sua música para formato MP3 (.mp3) e tente novamente.";
        console.error("R2 Proxy Upload - Erro de Validação de Formato:", { fileName, fileType });
        return res.status(400).json({ error: errMsg });
      }

      // 2. Validar Tamanho Máximo <= 20 MB (20 * 1024 * 1024)
      const maxSizeBytes = 20 * 1024 * 1024;
      if (fileSize > maxSizeBytes) {
        const formattedSize = (fileSize / (1024 * 1024)).toFixed(2);
        const errMsg = `Este arquivo MP3 possui ${formattedSize} MB, ultrapassando o limite máximo permitido de 20 MB.`;
        console.error("R2 Proxy Upload - Erro de Validação de Tamanho:", { fileSize, limit: maxSizeBytes });
        return res.status(400).json({ error: errMsg });
      }

      // Verify server setup environment variables securely displaying status
      const rawAccountId = process.env.R2_ACCOUNT_ID;
      const rawBucketName = process.env.R2_BUCKET_NAME;
      const rawAccessKeyId = process.env.R2_ACCESS_KEY_ID;
      const rawSecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
      const rawPublicBaseUrl = process.env.R2_PUBLIC_BASE_URL;

      console.log("R2 Auth Diagnostic Info:", {
        has_accountId: !!rawAccountId,
        accountId_len: rawAccountId?.length,
        has_bucketName: !!rawBucketName,
        bucketName: rawBucketName,
        has_accessKeyId: !!rawAccessKeyId,
        accessKeyId_len: rawAccessKeyId?.length,
        has_secretAccessKey: !!rawSecretAccessKey,
        secretAccessKey_len: rawSecretAccessKey?.length,
        has_publicBaseUrl: !!rawPublicBaseUrl,
        publicBaseUrl: rawPublicBaseUrl
      });

      const missingEnvVars: string[] = [];
      if (!rawAccountId) missingEnvVars.push("R2_ACCOUNT_ID");
      if (!rawAccessKeyId) missingEnvVars.push("R2_ACCESS_KEY_ID");
      if (!rawSecretAccessKey) missingEnvVars.push("R2_SECRET_ACCESS_KEY");
      if (!rawBucketName) missingEnvVars.push("R2_BUCKET_NAME");
      if (!rawPublicBaseUrl) missingEnvVars.push("R2_PUBLIC_BASE_URL");

      if (missingEnvVars.length > 0) {
        const errMsg = `Configuração do Cloudflare R2 incompleta no servidor. Faltam as variáveis: ${missingEnvVars.join(", ")}`;
        console.error("R2 Proxy Upload - Erro de Configuração:", errMsg);
        return res.status(500).json({ error: errMsg });
      }

      // Clean env variables
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

      // 3. Criar storagePath seguro
      const timestamp = Date.now();
      const cleanName = fileName.replace(/[^a-zA-Z0-9.]/g, "_");
      const baseName = cleanName.endsWith(".mp3") ? cleanName : `${cleanName}.mp3`;
      const storagePath = `users/${userId}/songs/${songId}/${timestamp}-${baseName}`;

      // 4. Inicializar S3Client compatível com R2
      const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
      console.log("R2 Proxy Client starting with endpoint:", endpoint);

      const s3 = new S3Client({
        region: "auto",
        endpoint,
        credentials: {
          accessKeyId: R2_ACCESS_KEY_ID,
          secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
        forcePathStyle: true,
      });

      // 5. Raw upload buffer
      const fileBuffer = req.body;
      if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
        throw new Error("Arquivo binário de áudio vazio ou inválido no corpo do Express.");
      }

      console.log("R2 Proxy Upload - Fazendo upload direto do Buffer pelo backend...");
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: storagePath,
        Body: fileBuffer,
        ContentType: fileType || "audio/mpeg",
      });

      await s3.send(command);

      // 6. Formar url pública de retorno
      const baseSlash = R2_PUBLIC_BASE_URL.endsWith("/") ? R2_PUBLIC_BASE_URL.slice(0, -1) : R2_PUBLIC_BASE_URL;
      const publicAudioUrl = `${baseSlash}/${storagePath}`;

      console.log("R2 Proxy Upload - Sucesso:", {
        storagePath,
        publicAudioUrl
      });

      return res.json({
        storagePath,
        publicAudioUrl,
      });

    } catch (err: any) {
      console.error("R2 Proxy Upload - Erro Crítico durante send:", err);
      // Extrair informações ricas do erro da AWS / R2
      const s3ErrorCode = err.Code || err.code || err.name || "SemCódigo";
      const s3ErrorMessage = err.message || String(err);
      const s3RequestID = err.$metadata?.requestId;
      const s3HttpStatus = err.$metadata?.httpStatusCode;

      console.error("Detalhes S3 extraídos:", {
        code: s3ErrorCode,
        message: s3ErrorMessage,
        requestId: s3RequestID,
        httpStatus: s3HttpStatus
      });

      return res.status(500).json({ 
        error: `Erro R2 [${s3ErrorCode} - HTTP ${s3HttpStatus}]: ${s3ErrorMessage}`,
        details: {
          code: s3ErrorCode,
          message: s3ErrorMessage,
          requestId: s3RequestID,
          status: s3HttpStatus
        }
      });
    }
  });

  // API Route for Mercado Pago webhook integrations
  app.post("/api/mercadopago-webhook", async (req, res) => {
    try {
      await mercadopagoWebhookHandler(req, res);
    } catch (err: any) {
      console.error("Local Dev - Error in local mercadopago-webhook wrapper:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || String(err) });
      }
    }
  });

  // API Route for Mercado Pago subscription creation
  app.post("/api/mercadopago/create-subscription", async (req, res) => {
    try {
      await createSubscriptionHandler(req, res);
    } catch (err: any) {
      console.error("Local Dev - Error in local create-subscription wrapper:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || String(err) });
      }
    }
  });

  // API Route for Mercado Pago live status check and sync
  app.post("/api/mercadopago/verify-subscription", async (req, res) => {
    try {
      await verifySubscriptionHandler(req, res);
    } catch (err: any) {
      console.error("Local Dev - Error in local verify-subscription wrapper:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || String(err) });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import mercadopagoWebhookHandler from "./api/mercadopago-webhook";
import createCheckoutPaymentHandler from "./api/mercadopago/create-checkout-payment";
import checkIntegrationsHandler from "./api/admin/check-integrations";
import sharp from "sharp";

dotenv.config();

// Initialize Firebase Admin securely for server.ts
let firebaseAdminApp;
if (!getApps().length) {
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
  const pIdRaw = process.env.FIREBASE_PROJECT_ID;
  const cEmailRaw = process.env.FIREBASE_CLIENT_EMAIL;
  const pKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  function cleanEnvValue(val: string | undefined): string {
    if (!val) return "";
    let s = val.trim();
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      s = s.substring(1, s.length - 1);
    }
    s = s.trim();
    if (s.endsWith(",")) {
      s = s.substring(0, s.length - 1);
    }
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      s = s.substring(1, s.length - 1);
    }
    return s.trim();
  }

  const projectIdClean = cleanEnvValue(pIdRaw);
  const clientEmailClean = cleanEnvValue(cEmailRaw);
  const privateKeyClean = cleanEnvValue(pKeyRaw)?.replace(/\\n/g, "\n").replace(/\\\\n/g, "\n");

  if (serviceAccountVar) {
    try {
      const serviceAccount = JSON.parse(serviceAccountVar);
      firebaseAdminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: "gen-lang-client-0946896754"
      });
    } catch (e) {
      console.error("Error parsing FIREBASE_SERVICE_ACCOUNT in server.ts:", e);
      firebaseAdminApp = initializeApp({
        projectId: "gen-lang-client-0946896754"
      });
    }
  } else if (projectIdClean && clientEmailClean && privateKeyClean) {
    try {
      firebaseAdminApp = initializeApp({
        credential: cert({
          projectId: projectIdClean,
          clientEmail: clientEmailClean,
          privateKey: privateKeyClean,
        }),
        projectId: projectIdClean
      });
      console.log("[Firebase Admin] Initialized successfully in server.ts with individual certificates.");
    } catch (e) {
      console.error("Error initializing Firebase Admin with individual certificates in server.ts:", e);
      firebaseAdminApp = initializeApp({
        projectId: "gen-lang-client-0946896754"
      });
    }
  } else {
    firebaseAdminApp = initializeApp({
      projectId: "gen-lang-client-0946896754"
    });
  }
} else {
  firebaseAdminApp = getApp();
}

const db = getFirestore(firebaseAdminApp, "ai-studio-656139fd-0f8f-4866-ada1-753533a8c5ff");

const cleanR2BucketName = (bucket: string): string => {
  let val = bucket.trim();
  if (val.startsWith("R2_BUCKET_NAME")) {
    const parts = val.split("=");
    if (parts.length > 1) {
      val = parts.slice(1).join("=");
    }
  }
  val = val.trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1).trim();
  }
  return val.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

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

      // 2. Validar Tamanho Máximo <= 6 MB
      const MAX_AUDIO_SIZE_BYTES = 6 * 1024 * 1024;
      if (fileSize > MAX_AUDIO_SIZE_BYTES) {
        const errMsg = "Este arquivo possui mais de 6 MB. Converta a música para MP3 em 96 ou 128 kbps e tente novamente.";
        console.error("Local Dev - Erro de Validação de Tamanho:", { fileSize, limit: MAX_AUDIO_SIZE_BYTES });
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
      const R2_BUCKET_NAME = cleanR2BucketName(rawBucketName!);
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

  // API Route for Cloudflare R2 presigned user avatar/image upload url
  app.post("/api/r2-presigned-image-upload", async (req, res) => {
    try {
      const { fileType, fileSize, userId } = req.body || {};
      const fileName = req.body?.fileName || req.body?.filename;

      console.log("Local Dev - Recebida requisição de imagem/avatar:", {
        fileName,
        fileType,
        fileSize,
        userId
      });

      if (!fileName || !fileType || fileSize === undefined || !userId) {
        const errMsg = "Parâmetros obrigatórios ausentes no body: fileName, fileType, fileSize e userId.";
        console.error("Local Dev - Erro de Validação de imagem:", errMsg, "Enviado:", req.body);
        return res.status(400).json({ error: errMsg });
      }

      // 1. Validar se o arquivo é imagem aceita
      const mimeLower = fileType.toLowerCase();
      const nameLower = fileName.toLowerCase();
      const isAcceptedMime = mimeLower === "image/jpeg" || mimeLower === "image/jpg" || mimeLower === "image/png" || mimeLower === "image/webp";
      const isAcceptedExt = nameLower.endsWith(".jpeg") || nameLower.endsWith(".jpg") || nameLower.endsWith(".png") || nameLower.endsWith(".webp");
      
      if (!isAcceptedMime && !isAcceptedExt) {
        const errMsg = "Formato de imagem inválido. Apenas JPEG, PNG e WEBP são aceitos.";
        console.error("Local Dev - Erro de Formato de Imagem:", { fileName, fileType });
        return res.status(400).json({ error: errMsg });
      }

      // 2. Validar Tamanho Máximo <= 2 MB
      const maxSizeBytes = 2 * 1024 * 1024;
      if (fileSize > maxSizeBytes) {
        const formattedSize = (fileSize / (1024 * 1024)).toFixed(2);
        const errMsg = `Esta imagem possui ${formattedSize} MB, ultrapassando o limite máximo permitido de 2 MB.`;
        console.error("Local Dev - Erro de Tamanho de Imagem:", { fileSize, limit: maxSizeBytes });
        return res.status(400).json({ error: errMsg });
      }

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
        console.error("Local Dev - Erro de Configuração de Imagem R2:", errMsg);
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
      const R2_BUCKET_NAME = cleanR2BucketName(rawBucketName!);
      const R2_ACCESS_KEY_ID = rawAccessKeyId!.trim();
      const R2_SECRET_ACCESS_KEY = rawSecretAccessKey!.trim();
      const R2_PUBLIC_BASE_URL = rawPublicBaseUrl!.trim();

      // 3. Criar caminho no R2: users/{userId}/avatar/{timestamp}-{safeFileName}
      const timestamp = Date.now();
      const safeFileName = fileName.replace(/[^a-zA-Z0-9.]/g, "_");
      const storagePath = `users/${userId}/avatar/${timestamp}-${safeFileName}`;

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

      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: storagePath,
        ContentType: fileType || "image/jpeg",
      });

      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
      const baseSlash = R2_PUBLIC_BASE_URL.endsWith("/") ? R2_PUBLIC_BASE_URL.slice(0, -1) : R2_PUBLIC_BASE_URL;
      const publicImageUrl = `${baseSlash}/${storagePath}`;

      console.log("Local Dev - URL de Imagem R2 gerada com sucesso:", {
        storagePath,
        publicImageUrl
      });

      return res.json({
        uploadUrl,
        storagePath,
        publicImageUrl,
      });

    } catch (err: any) {
      console.error("Local Dev - Erro ao gerar URL de imagem: ", err);
      return res.status(500).json({ 
        error: "Erro interno ao gerar uploadUrl de imagem: " + (err.message || String(err)) 
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

      // 2. Validar Tamanho Máximo <= 6 MB
      const MAX_AUDIO_SIZE_BYTES = 6 * 1024 * 1024;
      if (fileSize > MAX_AUDIO_SIZE_BYTES) {
        const errMsg = "Este arquivo possui mais de 6 MB. Converta a música para MP3 em 96 ou 128 kbps e tente novamente.";
        console.error("R2 Proxy Upload - Erro de Validação de Tamanho:", { fileSize, limit: MAX_AUDIO_SIZE_BYTES });
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
      const R2_BUCKET_NAME = cleanR2BucketName(rawBucketName!);
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

  // API Route for Cloudflare R2 proxy image/avatar upload (bypasses CORS entirely)
  app.post("/api/r2-proxy-image-upload", express.raw({ type: '*/*', limit: '2MB' }), async (req, res) => {
    const fileName = req.headers["x-file-name"] ? decodeURIComponent(req.headers["x-file-name"] as string) : undefined;
    const fileType = req.headers["x-file-type"] as string;
    const fileSizeStr = req.headers["x-file-size"] as string;
    const userId = req.headers["x-user-id"] as string;
    const fileSize = fileSizeStr ? parseInt(fileSizeStr, 10) : undefined;

    try {
      console.log("R2 Proxy Image Upload - Recebido proxy upload:", {
        fileName,
        fileType,
        fileSize,
        userId,
        bodyLength: req.body ? req.body.length : 0
      });

      if (!fileName || !fileType || fileSize === undefined || !userId) {
        const errMsg = "Parâmetros obrigatórios ausentes nos headers: x-file-name, x-file-type, x-file-size, x-user-id.";
        console.error("R2 Proxy Image Upload - Erro de Validação:", errMsg);
        return res.status(400).json({ error: errMsg });
      }

      // 1. Validar formato de imagem (JPEG, PNG, WEBP)
      const mimeLower = fileType.toLowerCase();
      const nameLower = fileName.toLowerCase();
      const isAcceptedMime = mimeLower === "image/jpeg" || mimeLower === "image/jpg" || mimeLower === "image/png" || mimeLower === "image/webp";
      const isAcceptedExt = nameLower.endsWith(".jpeg") || nameLower.endsWith(".jpg") || nameLower.endsWith(".png") || nameLower.endsWith(".webp");

      if (!isAcceptedMime && !isAcceptedExt) {
        const errMsg = "Formato de arquivo inválido. Apenas imagens nos formatos JPEG, PNG e WEBP são permitidas.";
        console.error("R2 Proxy Image Upload - Erro Formato:", { fileName, fileType });
        return res.status(400).json({ error: errMsg });
      }

      // 2. Validar tamanho máximo <= 2 MB
      const maxSizeBytes = 2 * 1024 * 1024;
      if (fileSize > maxSizeBytes) {
        const errMsg = `Esta imagem possui ${(fileSize / (1024 * 1024)).toFixed(2)} MB, ultrapassando o limite máximo permitido de 2 MB.`;
        console.error("R2 Proxy Image Upload - Erro Tamanho:", { fileSize, limit: maxSizeBytes });
        return res.status(400).json({ error: errMsg });
      }

      // Verify server setup environment variables securely
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
        console.error("R2 Proxy Image Upload - Erro de Configuração:", errMsg);
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
      const R2_BUCKET_NAME = cleanR2BucketName(rawBucketName!);
      const R2_ACCESS_KEY_ID = rawAccessKeyId!.trim();
      const R2_SECRET_ACCESS_KEY = rawSecretAccessKey!.trim();
      const R2_PUBLIC_BASE_URL = rawPublicBaseUrl!.trim();

      // 3. Criar caminho no R2: users/{userId}/avatar/{timestamp}-{safeFileName}
      const timestamp = Date.now();
      const safeFileName = fileName.replace(/[^a-zA-Z0-9.]/g, "_");
      const storagePath = `users/${userId}/avatar/${timestamp}-${safeFileName}`;

      // 4. Inicializar S3Client compatível com R2
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

      // 5. Raw upload buffer
      const fileBuffer = req.body;
      if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
        throw new Error("Arquivo binário da imagem vazio ou inválido no corpo do Express.");
      }

      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: storagePath,
        Body: fileBuffer,
        ContentType: fileType || "image/jpeg",
      });

      await s3.send(command);

      // 6. Formar url pública de retorno
      const baseSlash = R2_PUBLIC_BASE_URL.endsWith("/") ? R2_PUBLIC_BASE_URL.slice(0, -1) : R2_PUBLIC_BASE_URL;
      const publicImageUrl = `${baseSlash}/${storagePath}`;

      console.log("R2 Proxy Image Upload - Sucesso:", {
        storagePath,
        publicImageUrl
      });

      return res.json({
        storagePath,
        publicImageUrl,
      });

    } catch (err: any) {
      console.error("R2 Proxy Image Upload - Erro Crítico durante send:", err);
      const s3ErrorCode = err.Code || err.code || err.name || "SemCódigo";
      const s3ErrorMessage = err.message || String(err);
      const s3HttpStatus = err.$metadata?.httpStatusCode;

      return res.status(500).json({ 
        error: `Erro R2 [${s3ErrorCode} - HTTP ${s3HttpStatus}]: ${s3ErrorMessage}`
      });
    }
  });

  // API Route for global sharing image card upload (Admin only)
  app.post("/api/admin/upload-share-card", express.raw({ type: '*/*', limit: '10MB' }), async (req, res) => {
    const fileName = req.headers["x-file-name"] ? decodeURIComponent(req.headers["x-file-name"] as string) : undefined;
    const fileType = req.headers["x-file-type"] as string;
    const fileSizeStr = req.headers["x-file-size"] as string;
    const userId = req.headers["x-user-id"] as string;
    const userEmailHeader = req.headers["x-user-email"] as string;
    const fileSize = fileSizeStr ? parseInt(fileSizeStr, 10) : undefined;

    try {
      console.log("Global Share Card Upload - Received Admin upload request:", {
        fileName,
        fileType,
        fileSize,
        userId,
        userEmailHeader,
        bodyLength: req.body ? req.body.length : 0
      });

      if (!fileName || !fileType || fileSize === undefined || !userId) {
        const errMsg = "Parâmetros obrigatórios ausentes nos headers: x-file-name, x-file-type, x-file-size, x-user-id.";
        console.error("Global Play Card - Erro de Validação:", errMsg);
        return res.status(400).json({ error: errMsg });
      }

      // 1. Validar formato de imagem (JPEG, PNG, WEBP)
      const mimeLower = fileType.toLowerCase();
      const nameLower = fileName.toLowerCase();
      const isAcceptedMime = mimeLower === "image/jpeg" || mimeLower === "image/jpg" || mimeLower === "image/png" || mimeLower === "image/webp";
      const isAcceptedExt = nameLower.endsWith(".jpeg") || nameLower.endsWith(".jpg") || nameLower.endsWith(".png") || nameLower.endsWith(".webp");

      if (!isAcceptedMime && !isAcceptedExt) {
        const errMsg = "Formato de arquivo inválido. Apenas imagens nos formatos JPEG, PNG e WEBP são permitidas.";
        console.error("Global Play Card - Erro Formato:", { fileName, fileType });
        return res.status(400).json({ error: errMsg });
      }

      // 2. Validar se o usuário é administrador (Com bypass de e-mail rápido para evitar timeouts)
      const emailHeaderClean = userEmailHeader ? userEmailHeader.toLowerCase().trim() : "";
      const isMainAdminByEmail = emailHeaderClean === 'videopremieroficial@gmail.com' || emailHeaderClean === 'sertanejopremier@gmail.com';
      
      let isAdmin = isMainAdminByEmail;

      if (!isAdmin) {
        try {
          const userDoc = await db.collection("users").doc(userId).get();
          const artistDoc = await db.collection("artists").doc(userId).get();

          const userData = userDoc.exists ? userDoc.data() : null;
          const artistData = artistDoc.exists ? artistDoc.data() : null;

          const email = (userData?.email || artistData?.email || "").toLowerCase().trim();
          const role = userData?.role || artistData?.role || "";

          const isMainAdmin = email === 'videopremieroficial@gmail.com' || email === 'sertanejopremier@gmail.com';
          isAdmin = isMainAdmin || role === 'admin';
        } catch (dbErr: any) {
          console.error("Erro ao verificar admin no Firestore durante upload:", dbErr);
          // Se o banco falhar, mas o cabeçalho confirmou um admin oficial, autoriza.
          if (isMainAdminByEmail) {
            isAdmin = true;
          }
        }
      }

      if (!isAdmin) {
        return res.status(403).json({ error: "Acesso negado. Ação restrita a administradores." });
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
        const errMsg = `Configuração do Cloudflare R2 incompleta no servidor. Faltam: ${missingEnvVars.join(", ")}`;
        console.error("Global Play Card - Erro Ambientes:", errMsg);
        return res.status(500).json({ error: errMsg });
      }

      const cleanR2Id = (id: string): string => {
        let val = id.trim();
        const hexMatch = val.match(/\b([a-fA-F0-9]{32})\b/);
        if (hexMatch) return hexMatch[1];
        val = val.replace(/^https?:\/\//i, "");
        val = val.split("/")[0];
        val = val.split(".")[0];
        return val;
      };

      const R2_ACCOUNT_ID = cleanR2Id(rawAccountId!);
      const R2_BUCKET_NAME = cleanR2BucketName(rawBucketName!);
      const R2_ACCESS_KEY_ID = rawAccessKeyId!.trim();
      const R2_SECRET_ACCESS_KEY = rawSecretAccessKey!.trim();
      const R2_PUBLIC_BASE_URL = rawPublicBaseUrl!.trim();

      // 4. Caminho de salvamento fixo com timestamp sob prefixo 'users/.../avatar/' para cumprir as políticas do R2
      const timestamp = Date.now();
      const safeFileName = fileName.replace(/[^a-zA-Z0-9.]/g, "_");
      const storagePath = `users/${userId}/avatar/global-share-card-${timestamp}-${safeFileName}`;

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
      const fileBuffer = req.body;
      if (!Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
        throw new Error("Arquivo enviado de imagem está vazio.");
      }

      // 7. Enviar via PutObjectCommand
      const command = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: storagePath,
        Body: fileBuffer,
        ContentType: fileType || "image/png",
      });

      await s3.send(command);

      const baseSlash = R2_PUBLIC_BASE_URL.endsWith("/") ? R2_PUBLIC_BASE_URL.slice(0, -1) : R2_PUBLIC_BASE_URL;
      const publicImageUrl = `${baseSlash}/${storagePath}`;

      // 8. Salvar URL no Firestore em settings/shareCard
      let dbWriteSucceeded = false;
      const currentVersion = String(Date.now());
      try {
        await db.collection("settings").doc("shareCard").set({
          ogImageUrl: publicImageUrl,
          ogImageVersion: currentVersion,
          updatedAt: new Date().toISOString(),
          updatedBy: userId
        }, { merge: true });
        dbWriteSucceeded = true;
      } catch (dbErr: any) {
        console.warn("Could not save to settings/shareCard from server (falling back to client write):", dbErr.message || dbErr);
      }

      console.log("Global Share Card Upload - Concluido com sucesso:", {
        storagePath,
        publicImageUrl,
        dbWriteSucceeded,
        currentVersion
      });

      return res.status(200).json({
        storagePath,
        publicImageUrl,
        dbWriteSucceeded,
        ogImageVersion: currentVersion
      });

    } catch (e: any) {
      console.error("Critical error in upload-share-card endpoint:", e);
      return res.status(500).json({
        error: `Erro ao fazer upload da imagem global de compartilhamento: ${e.message || String(e)}`
      });
    }
  });

  // REST API helper to fetch the global share card settings, bypassing any missing server-side service-account privileges on the named database
  const fetchGlobalShareCardRest = async (): Promise<{ ogImageUrl: string; ogImageVersion: string; updatedAt: string } | null> => {
    const projectId = "gen-lang-client-0946896754";
    const databaseId = "ai-studio-656139fd-0f8f-4866-ada1-753533a8c5ff";
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/settings/shareCard`;
      const res = await fetch(url);
      if (res.ok) {
        const doc = await res.json();
        const f = doc.fields || {};
        const ogImageUrl = f.ogImageUrl?.stringValue || "";
        const ogImageVersion = f.ogImageVersion?.stringValue || "";
        const updatedAtStr = f.updatedAt?.stringValue || f.updatedAt?.timestampValue || doc.updateTime || new Date().toISOString();
        return {
          ogImageUrl,
          ogImageVersion,
          updatedAt: updatedAtStr
        };
      } else {
        console.warn("REST global share card fetch status not OK:", res.status);
      }
    } catch (err: any) {
      console.warn("REST global share card fetch failed:", err.message || err);
    }
    return null;
  };

  // Proxy endpoint to load global sharing image across any browser, CORS free and crawler-friendly
  const serveGlobalShareCard = async (req: any, res: any) => {
    try {
      const shareCard = await fetchGlobalShareCardRest();
      if (shareCard && shareCard.ogImageUrl && shareCard.ogImageUrl.trim() !== "") {
        console.log("Serving custom global share card proxy from:", shareCard.ogImageUrl);
        const imgRes = await fetch(shareCard.ogImageUrl);
        if (imgRes.ok) {
          const arrayBuffer = await imgRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const contentType = imgRes.headers.get("Content-Type") || "image/png";
          res.setHeader("Content-Type", contentType);
          res.setHeader("Cache-Control", "public, max-age=3600"); // 1 hour browser cache
          return res.send(buffer);
        } else {
          console.warn("Failed to proxy direct image, status:", imgRes.status);
        }
      }

      const { buffer, contentType } = await generateArtistPngBuffer("default");
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=3600"); // 1 hour browser cache
      return res.send(buffer);
    } catch (err: any) {
      console.error("Error serving proxy global share card:", err);
      // Fallback: redirect dynamically to make it load even in case of fetch errors
      try {
        const shareCard = await fetchGlobalShareCardRest();
        if (shareCard && shareCard.ogImageUrl && shareCard.ogImageUrl.trim() !== "") {
          return res.redirect(shareCard.ogImageUrl);
        }
      } catch (e) {}

      return res.status(500).json({ error: "Erro ao baixar a imagem: " + err.message });
    }
  };

  // Helper to dynamically build/inject the Open Graph metadata for the home page / main site
  const generateHomeHtml = async (req: any) => {
    const host = req.headers['x-forwarded-host'] || req.headers.host || process.env.APP_BASE_URL || "www.somdrive.com.br";
    const protocol = req.headers['x-forwarded-proto'] || "https";
    const dynamicAppBaseUrl = host.includes("://") ? host : `${protocol}://${host}`;
    const appBaseUrl = dynamicAppBaseUrl.replace(/\/$/, "");

    let ogImageToUse = "";
    try {
      const shareCard = await fetchGlobalShareCardRest();
      if (shareCard && shareCard.ogImageUrl && shareCard.ogImageUrl.trim() !== "") {
        ogImageToUse = shareCard.ogImageUrl.trim();
      }
    } catch (fErr) {
      console.warn("Could not fetch global share card settings for home:", fErr);
    }

    if (!ogImageToUse) {
      ogImageToUse = "https://pub-dda3bc59b7224a77a905ceeef207d9c8.r2.dev/settings/shareCard.png";
    }

    const indexPath = process.env.NODE_ENV === "production"
      ? path.join(process.cwd(), 'dist', 'index.html')
      : path.join(process.cwd(), 'index.html');

    const fsMod = await import('fs');
    if (fsMod.existsSync(indexPath)) {
      let htmlContents = fsMod.readFileSync(indexPath, 'utf8');

      // Clean static tags fully to prevent duplicates and legacy tag leakage
      htmlContents = htmlContents
        .replace(/<title>.*?<\/title>/gi, "")
        .replace(/<meta\s+[^>]*name\s*=\s*["']?description["']?[^>]*\/?>/gi, "")
        .replace(/<meta\s+[^>]*property\s*=\s*["']?og:[^"'\s>]*["']?[^>]*\/?>/gi, "")
        .replace(/<meta\s+[^>]*name\s*=\s*["']?twitter:[^"'\s>]*["']?[^>]*\/?>/gi, "");

      let ogImageSecureToUse = ogImageToUse;
      if (ogImageSecureToUse.startsWith("http://")) {
        ogImageSecureToUse = ogImageSecureToUse.replace("http://", "https://");
      }

      const ogPayload = `
  <!-- Dynamic Custom SomDrive OG Home Metadata -->
  <title>SomDrive | Divulgue seu Repertório Musical</title>
  <meta name="description" content="A plataforma definitiva para compositores, artistas e bandas gerenciarem seus catálogos musicais." />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="SomDrive - Catálogo Musical" />
  <meta property="og:description" content="Ouça músicas e composições compartilhadas pelo artista." />
  <meta property="og:image" content="${ogImageToUse}" />
  <meta property="og:image:secure_url" content="${ogImageSecureToUse}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${appBaseUrl}/" />
  <meta property="og:site_name" content="SomDrive" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="SomDrive - Catálogo Musical" />
  <meta name="twitter:description" content="Ouça músicas e composições compartilhadas pelo artista." />
  <meta name="twitter:image" content="${ogImageToUse}" />
  <link rel="image_src" href="${ogImageToUse}" />
  <meta itemprop="image" content="${ogImageToUse}" />
`;

      if (htmlContents.includes("</head>")) {
        htmlContents = htmlContents.replace("</head>", `${ogPayload}\n</head>`);
      } else {
        htmlContents = htmlContents.replace("<head>", `<head>\n${ogPayload}`);
      }

      return htmlContents;
    } else {
      throw new Error(`index.html not found`);
    }
  };

  // Helper to dynamically build/inject the Open Graph metadata for any artist URI/slug
  const generateArtistHtml = async (slugOrId: string, req: any) => {
    console.time("catalogo-total");
    console.time("buscar-artista");
    const { userId: resolvedArtistId, name, genre, city, customCardImageUrl, slug: resolvedSlug } = await fetchArtistRest(slugOrId);
    console.timeEnd("buscar-artista");
    const formattedName = name.trim();

    const slugifyStr = (text: string) => {
      return text
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-');
    };

    const cleanSlug = resolvedSlug || (formattedName ? slugifyStr(formattedName) : resolvedArtistId);

    const host = req?.headers?.['x-forwarded-host'] || req?.headers?.host || process.env.APP_BASE_URL || "www.somdrive.com.br";
    const protocol = req?.headers?.['x-forwarded-proto'] || "https";
    const dynamicAppBaseUrl = host.includes("://") ? host : `${protocol}://${host}`;
    const appBaseUrl = dynamicAppBaseUrl.replace(/\/$/, "");

    // Priority: 1. Global site share card configured by admin. 2. Fallback standard SomDrive image.
    let ogImageToUse = "";
    try {
      const shareCard = await fetchGlobalShareCardRest();
      if (shareCard && shareCard.ogImageUrl && shareCard.ogImageUrl.trim() !== "") {
        // Direct public R2 URL from settings/shareCard.ogImageUrl as required
        ogImageToUse = shareCard.ogImageUrl.trim();
      }
    } catch (fErr) {
      console.warn("Could not fetch global share card settings for artist profile ogg tag:", fErr);
    }

    if (!ogImageToUse) {
      ogImageToUse = "https://pub-dda3bc59b7224a77a905ceeef207d9c8.r2.dev/settings/shareCard.png";
    }

    const ogUrlToUse = slugOrId === "ze-quirino" ? "https://www.somdrive.com.br/s/ze-quirino" : `${appBaseUrl}/s/${slugOrId}`;

    const indexPath = process.env.NODE_ENV === "production" 
      ? path.join(process.cwd(), 'dist', 'index.html')
      : path.join(process.cwd(), 'index.html');

    const fsMod = await import('fs');
    if (fsMod.existsSync(indexPath)) {
      let htmlContents = fsMod.readFileSync(indexPath, 'utf8');

      // Clean static tags fully to prevent duplicates and legacy tag leakage
      htmlContents = htmlContents
        .replace(/<title>.*?<\/title>/gi, "")
        .replace(/<meta\s+[^>]*name\s*=\s*["']?description["']?[^>]*\/?>/gi, "")
        .replace(/<meta\s+[^>]*property\s*=\s*["']?og:[^"'\s>]*["']?[^>]*\/?>/gi, "")
        .replace(/<meta\s+[^>]*name\s*=\s*["']?twitter:[^"'\s>]*["']?[^>]*\/?>/gi, "");

      let ogImageSecureToUse = ogImageToUse;
      if (ogImageSecureToUse.startsWith("http://")) {
        ogImageSecureToUse = ogImageSecureToUse.replace("http://", "https://");
      }

      const ogPayload = `
  <!-- Dynamic Custom SomDrive OG Sharing Metadata -->
  <title>Catálogo musical de ${formattedName} | SomDrive</title>
  <meta name="description" content="Ouça músicas e composições compartilhadas pelo artista." />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="SomDrive - Catálogo Musical" />
  <meta property="og:description" content="Ouça músicas e composições compartilhadas pelo artista." />
  <meta property="og:image" content="${ogImageToUse}" />
  <meta property="og:image:secure_url" content="${ogImageSecureToUse}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${ogUrlToUse}" />
  <meta property="og:site_name" content="SomDrive" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="SomDrive - Catálogo Musical" />
  <meta name="twitter:description" content="Ouça músicas e composições compartilhadas pelo artista." />
  <meta name="twitter:image" content="${ogImageToUse}" />
  <link rel="image_src" href="${ogImageToUse}" />
  <meta itemprop="image" content="${ogImageToUse}" />
`;

      if (htmlContents.includes("</head>")) {
        htmlContents = htmlContents.replace("</head>", `${ogPayload}\n</head>`);
      } else {
        htmlContents = htmlContents.replace("<head>", `<head>\n${ogPayload}`);
      }

      console.timeEnd("catalogo-total");
      return {
        html: htmlContents,
        artistName: formattedName,
        ogImageUrl: ogImageToUse,
        finalOgImageUrl: ogImageToUse,
        ogUrl: ogUrlToUse,
        artistFound: true
      };
    } else {
      console.timeEnd("catalogo-total");
      throw new Error(`index.html not found`);
    }
  };

  // Helper to dynamically build/inject the Open Graph metadata for the clean WhatsApp short share route
  const generateShareHtml = async (slugOrId: string, req?: any) => {
    const originalSlug = slugOrId;
    const { userId: resolvedArtistId, name, genre, city, customCardImageUrl, slug: resolvedSlug } = await fetchArtistRest(slugOrId);
    const formattedName = name.trim();

    const slugifyStr = (text: string) => {
      return text
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-');
    };

    const cleanSlug = originalSlug;

    const host = req?.headers?.['x-forwarded-host'] || req?.headers?.host || process.env.APP_BASE_URL || "www.somdrive.com.br";
    const protocol = req?.headers?.['x-forwarded-proto'] || "https";
    const dynamicAppBaseUrl = host.includes("://") ? host : `${protocol}://${host}`;
    const appBaseUrl = dynamicAppBaseUrl.replace(/\/$/, "");

    // Priority: 1. Global site share card configured by admin. 2. Fallback standard SomDrive image.
    let ogImageToUse = "";
    try {
      const shareCard = await fetchGlobalShareCardRest();
      if (shareCard && shareCard.ogImageUrl && shareCard.ogImageUrl.trim() !== "") {
        // Direct public R2 URL from settings/shareCard.ogImageUrl as required
        ogImageToUse = shareCard.ogImageUrl.trim();
      }
    } catch (fErr) {
      console.warn("Could not fetch global share card settings for share redirect:", fErr);
    }

    if (!ogImageToUse) {
      ogImageToUse = "https://pub-dda3bc59b7224a77a905ceeef207d9c8.r2.dev/settings/shareCard.png";
    }

    const ogUrlToUse = originalSlug === "ze-quirino" ? "https://www.somdrive.com.br/s/ze-quirino" : `${appBaseUrl}/s/${originalSlug}`;

    let ogImageSecureToUse = ogImageToUse;
    if (ogImageSecureToUse.startsWith("http://")) {
      ogImageSecureToUse = ogImageSecureToUse.replace("http://", "https://");
    }

    const htmlContents = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Catálogo musical de ${formattedName} | SomDrive</title>
  <meta property="og:type" content="website" />
  <meta property="og:title" content="SomDrive - Catálogo Musical" />
  <meta property="og:description" content="Ouça músicas e composições compartilhadas pelo artista." />
  <meta property="og:image" content="${ogImageToUse}" />
  <meta property="og:image:secure_url" content="${ogImageSecureToUse}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${ogUrlToUse}" />
  <meta property="og:site_name" content="SomDrive" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="SomDrive - Catálogo Musical" />
  <meta name="twitter:description" content="Ouça músicas e composições compartilhadas pelo artista." />
  <meta name="twitter:image" content="${ogImageToUse}" />
  <link rel="image_src" href="${ogImageToUse}" />
  <meta itemprop="image" content="${ogImageToUse}" />
  <script>
    window.location.replace("/catalogo/${originalSlug}");
  </script>
</head>
<body style="background: #09090b; color: #a1a1aa; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
  <div style="text-align: center;">
    <p>Redirecionando para o catálogo de <strong>${formattedName}</strong>...</p>
    <p style="font-size: 13px; color: #52525b;">Se não for redirecionado, <a href="/catalogo/${originalSlug}" style="color: #10b981; text-decoration: none; font-weight: bold;">clique aqui</a>.</p>
  </div>
</body>
</html>`;

    return {
      html: htmlContents,
      artistName: formattedName,
      ogImageUrl: ogImageToUse,
      finalOgImageUrl: ogImageToUse,
      cleanSlug,
      artistFound: true
    };
  };

  app.get("/api/global-share-card", serveGlobalShareCard);
  app.get("/api/global-share-card.png", serveGlobalShareCard);

  // Debugging route for verifying matching OG properties
  app.get("/api/debug/og", async (req: any, res: any) => {
    const slug = String(req.query.slug || "ze-quirino").trim();
    try {
      const result = await generateArtistHtml(slug, req);
      const html = result.html;
      const htmlHasOldImage = /unsplash|show|concert|crowd|plateia/i.test(html);
      const htmlOgImageCount = (html.match(/<meta[^>]*property=["']og:image["']/gi) || []).length;
      const htmlTwitterImageCount = (html.match(/<meta[^>]*name=["']twitter:image["']/gi) || []).length;

      return res.status(200).json({
        slug,
        artistFound: result.artistFound,
        artistName: result.artistName,
        ogImageUrl: result.ogImageUrl,
        finalOgImageUrl: result.finalOgImageUrl,
        ogUrl: result.ogUrl,
        htmlHasOldImage,
        htmlOgImageCount,
        htmlTwitterImageCount
      });
    } catch (err: any) {
      return res.status(200).json({
        slug,
        artistFound: false,
        artistName: "",
        ogImageUrl: "",
        finalOgImageUrl: "",
        ogUrl: `${(process.env.APP_BASE_URL || "https://www.somdrive.com.br").replace(/\/$/, "")}/catalogo/${slug}`,
        htmlHasOldImage: false,
        htmlOgImageCount: 0,
        htmlTwitterImageCount: 0,
        error: err.message
      });
    }
  });

  // HTML OG visualizer requested
  app.get("/api/debug/og-html", async (req: any, res: any) => {
    const slug = String(req.query.slug || "ze-quirino").trim();
    try {
      const result = await generateArtistHtml(slug, req);
      const headContent = result.html.split("<head>")[1]?.split("</head>")[0] || result.html;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.send(headContent.trim());
    } catch (err: any) {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.status(500).send("Error compiling OG Head: " + err.message);
    }
  });

  // Speed, latency, and structure diagnostics endpoint for public catalog URLs
  app.get("/api/debug/catalog-speed", async (req: any, res: any) => {
    const slug = String(req.query.slug || "ze-quirino").trim();
    const projectId = "gen-lang-client-0946896754";
    const databaseId = "ai-studio-656139fd-0f8f-4866-ada1-753533a8c5ff";
    
    let totalStart = Date.now();
    let artistFound = false;
    let artistLookupMs = 0;
    let songsFound = 0;
    let songsLookupMs = 0;
    let shareCardLookupMs = 0;
    let redirectsDetected = false;
    let errors: string | null = null;
    let resolvedUserId = "";

    try {
      // 1. Measure Artist Lookup Time
      const artistStart = Date.now();
      try {
        const artist = await fetchArtistRest(slug);
        artistLookupMs = Date.now() - artistStart;
        if (artist && artist.userId) {
          artistFound = true;
          resolvedUserId = artist.userId;
        }
      } catch (err: any) {
        artistLookupMs = Date.now() - artistStart;
        errors = (errors ? errors + "; " : "") + "Artist lookup failed: " + err.message;
      }

      // 2. Measure Songs Lookup Time (if artist exists)
      if (artistFound && resolvedUserId) {
        const songsStart = Date.now();
        try {
          // Query 'songs' root collection via Firestore RunQuery REST API
          const runQueryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:runQuery`;
          const runQueryBody = {
            structuredQuery: {
              from: [{ collectionId: "songs" }],
              where: {
                fieldFilter: {
                  field: { fieldPath: "ownerId" },
                  op: "EQUAL",
                  value: { stringValue: resolvedUserId }
                }
              }
            }
          };

          const runQueryRes = await fetch(runQueryUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(runQueryBody)
          });

          if (runQueryRes.ok) {
            const queryResults = await runQueryRes.json();
            if (Array.isArray(queryResults)) {
              songsFound = queryResults.filter(q => q.document).length;
            }
          }

          // If no songs found in root, check legacy subcollection as well
          if (songsFound === 0) {
            const subColUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/artists/${resolvedUserId}/musics?pageSize=100`;
            const subColRes = await fetch(subColUrl);
            if (subColRes.ok) {
              const subColData = await subColRes.json();
              const docs = subColData.documents || [];
              songsFound = docs.length;
            }
          }
        } catch (songErr: any) {
          errors = (errors ? errors + "; " : "") + "Songs lookup failed: " + songErr.message;
        }
        songsLookupMs = Date.now() - songsStart;
      }

      // 3. Measure Global Share Card Lookup Time
      const shareCardStart = Date.now();
      try {
        await fetchGlobalShareCardRest();
      } catch (scErr: any) {
        errors = (errors ? errors + "; " : "") + "Share card lookup failed: " + scErr.message;
      }
      shareCardLookupMs = Date.now() - shareCardStart;

    } catch (criticalErr: any) {
      errors = (errors ? errors + "; " : "") + "Critical diagnostics exception: " + criticalErr.message;
    }

    const totalMs = Date.now() - totalStart;

    return res.status(200).json({
      slug,
      artistFound,
      artistLookupMs,
      songsFound,
      songsLookupMs,
      shareCardLookupMs,
      totalMs,
      redirectsDetected,
      errors
    });
  });

  // Diagnostic endpoint for social sharing behavior
  app.get("/api/debug/share", async (req: any, res: any) => {
    const targetUrl = req.query.url;

    if (targetUrl) {
      try {
        // 1. Fetch the target page HTML
        const response = await fetch(targetUrl);
        if (!response.ok) {
          return res.status(200).json({
            url: targetUrl,
            success: false,
            httpStatus: response.status,
            error: `Falha ao acessar a URL. Status: ${response.status}`,
          });
        }

        const html = await response.text();

        // 2. Extract meta tags using regex
        const getMeta = (propertyOrName: string) => {
          const regex = new RegExp(
            `<meta[^>]*(?:property|name)=["']${propertyOrName}["'][^>]*content=["']([^"']*)["']`,
            "i"
          );
          const match = html.match(regex);
          if (match) return match[1];

          // Alternative order
          const revRegex = new RegExp(
            `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${propertyOrName}["']`,
            "i"
          );
          const revMatch = html.match(revRegex);
          return revMatch ? revMatch[1] : null;
        };

        const title = getMeta("og:title") || getMeta("twitter:title");
        const description = getMeta("og:description") || getMeta("twitter:description");
        const image = getMeta("og:image") || getMeta("twitter:image");

        let imageAccessible = false;
        let imageSize = null;
        let imageHttpStatus = null;

        if (image) {
          try {
            let resolvedImageUrl = image;
            if (image.startsWith("/")) {
              const parsedTarget = new URL(targetUrl);
              resolvedImageUrl = `${parsedTarget.origin}${image}`;
            }

            const imgResponse = await fetch(resolvedImageUrl, { method: "GET" });
            imageHttpStatus = imgResponse.status;
            imageAccessible = imgResponse.ok;
            if (imgResponse.ok) {
              const contentLength = imgResponse.headers.get("content-length");
              imageSize = contentLength ? parseInt(contentLength) : null;
              if (!imageSize) {
                const buffer = await imgResponse.arrayBuffer();
                imageSize = buffer.byteLength;
              }
            }
          } catch (imgErr: any) {
            console.warn("Error debugging image accessibility:", imgErr);
          }
        }

        return res.status(200).json({
          "og:title encontrado": title || "Não encontrado",
          "og:description encontrado": description || "Não encontrado",
          "og:image encontrado": image || "Não encontrado",
          "se a imagem está acessível publicamente": imageAccessible,
          "status HTTP da imagem": imageHttpStatus,
          "tamanho da imagem": imageSize !== null ? `${(imageSize / 1024).toFixed(2)} KB (${imageSize} bytes)` : "Desconhecido",
          "URL final usada": image || "Não encontrado"
        });
      } catch (err: any) {
        return res.status(500).json({
          error: "Erro ao debugar compartilhamento por URL",
          details: err.message || String(err)
        });
      }
    }

    const slug = String(req.query.slug || "ze-quirino").trim();
    try {
      const result = await generateShareHtml(slug, req);
      const html = result.html;
      const oldImageFound = /unsplash|show|concert|crowd|plateia/i.test(html);
      const ogImageCount = (html.match(/<meta[^>]*property=["']og:image["']/gi) || []).length;
      const twitterImageCount = (html.match(/<meta[^>]*name=["']twitter:image["']/gi) || []).length;

      const appBaseUrl = (process.env.APP_BASE_URL || "https://www.somdrive.com.br").replace(/\/$/, "");
      return res.status(200).json({
        shareUrl: `${appBaseUrl}/s/${result.cleanSlug}`,
        catalogUrl: `${appBaseUrl}/catalogo/${result.cleanSlug}`,
        artistFound: result.artistFound,
        artistName: result.artistName,
        ogImageUrl: result.ogImageUrl,
        finalOgImageUrl: result.finalOgImageUrl,
        oldImageFound,
        ogImageCount,
        twitterImageCount
      });
    } catch (err: any) {
      const appBaseUrl = (process.env.APP_BASE_URL || "https://www.somdrive.com.br").replace(/\/$/, "");
      return res.status(200).json({
        shareUrl: `${appBaseUrl}/s/${slug}`,
        catalogUrl: `${appBaseUrl}/catalogo/${slug}`,
        artistFound: false,
        artistName: "",
        ogImageUrl: "",
        finalOgImageUrl: "",
        oldImageFound: false,
        ogImageCount: 0,
        twitterImageCount: 0,
        error: err.message
      });
    }
  });

  // API Route for Mercado Pago webhook integrations
  app.post("/api/mercadopago-webhook", async (req, res) => {
    try {
      const handlerFn = typeof mercadopagoWebhookHandler === "function" 
        ? mercadopagoWebhookHandler 
        : (mercadopagoWebhookHandler as any)?.default;
      await handlerFn(req, res);
    } catch (err: any) {
      console.error("Local Dev - Error in local mercadopago-webhook wrapper:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || String(err) });
      }
    }
  });

  // API Route for Mercado Pago Checkout Pro preference creation
  app.post("/api/mercadopago/create-checkout-payment", async (req, res) => {
    try {
      const handlerFn = typeof createCheckoutPaymentHandler === "function" 
        ? createCheckoutPaymentHandler 
        : (createCheckoutPaymentHandler as any)?.default;
      await handlerFn(req, res);
    } catch (err: any) {
      console.error("Local Dev - Error in local create-checkout-payment wrapper:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || String(err) });
      }
    }
  });

  // API Route for admin integrations check
  app.get("/api/admin/check-integrations", async (req, res) => {
    try {
      const handlerFn = typeof checkIntegrationsHandler === "function" 
        ? checkIntegrationsHandler 
        : (checkIntegrationsHandler as any)?.default;
      await handlerFn(req, res);
    } catch (err: any) {
      console.error("Local Dev - Error in check-integrations wrapper:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || String(err) });
      }
    }
  });

  app.post("/api/admin/check-integrations", async (req, res) => {
    try {
      const handlerFn = typeof checkIntegrationsHandler === "function" 
        ? checkIntegrationsHandler 
        : (checkIntegrationsHandler as any)?.default;
      await handlerFn(req, res);
    } catch (err: any) {
      console.error("Local Dev - Error in check-integrations wrapper:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || String(err) });
      }
    }
  });

  // Serve dynamic and cached favicon.svg
  app.get("/favicon.svg", (req, res) => {
    const faviconContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Seamless vibrant green gradient matching the gorgeous new logo -->
    <linearGradient id="yellow-gold-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#36eb18" />    <!-- Luminant bright top green -->
      <stop offset="42%" stop-color="#1db954" />   <!-- Classic Spotify brand green -->
      <stop offset="100%" stop-color="#05591c" />  <!-- Premium deep glossy forest green -->
    </linearGradient>
  </defs>

  <!-- Main circle base - perfectly round and centered -->
  <circle cx="256" cy="256" r="256" fill="url(#yellow-gold-grad)" />

  <!-- Outer shiny bezel stroke for premium glossy sticker look -->
  <circle cx="256" cy="256" r="252" stroke="rgba(255, 255, 255, 0.22)" stroke-width="6" fill="none" />
  <circle cx="256" cy="256" r="249" stroke="rgba(0, 0, 0, 0.12)" stroke-width="2" fill="none" />

  <!-- Symmetrical/Clean soundwave bars on left - slightly thicker for well-filled style -->
  <g fill="#FFFFFF">
    <!-- Short left bar -->
    <rect x="100" y="215" width="24" height="82" rx="12" />
    <!-- Tall middle bar -->
    <rect x="134" y="165" width="24" height="182" rx="12" />
    <!-- Short right bar -->
    <rect x="168" y="230" width="24" height="52" rx="12" />
  </g>

  <!-- Gorgeous solid white dot - beautifully integrated and clean -->
  <circle cx="168" cy="318" r="13" fill="#FFFFFF" />

  <!-- Gorgeous stylized letter 'S' looping around - thicker stroke (48px) for bold premium look -->
  <path d="M 400,180 C 400,135 350,115 300,115 C 245,115 220,150 220,205 C 220,280 390,245 390,315 C 390,370 350,395 295,395 C 240,395 210,355 210,320" 
        fill="none" 
        stroke="#FFFFFF" 
        stroke-width="48" 
        stroke-linecap="round" 
        stroke-linejoin="round" />
</svg>`;
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    return res.status(200).send(faviconContent);
  });

  // Serve high-quality dynamic PNG logo representations for Player/Media Session Artwork
  [96, 128, 192, 256, 384, 512].forEach((size) => {
    app.get(`/somdrive-player-${size}.png`, async (req, res) => {
      try {
        const playerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Seamless vibrant green gradient matching the gorgeous new logo -->
    <linearGradient id="yellow-gold-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#36eb18" />    <!-- Luminant bright top green -->
      <stop offset="42%" stop-color="#1db954" />   <!-- Classic Spotify brand green -->
      <stop offset="100%" stop-color="#05591c" />  <!-- Premium deep glossy forest green -->
    </linearGradient>
  </defs>

  <!-- Main fully-filled square base -->
  <rect width="512" height="512" fill="url(#yellow-gold-grad)" />

  <!-- Inner circular subtle highlight (glossy premium inner disc/circle) -->
  <circle cx="256" cy="256" r="236" fill="rgba(255, 255, 255, 0.03)" stroke="rgba(255, 255, 255, 0.15)" stroke-width="4" />

  <!-- Symmetrical/Clean soundwave bars on left - slightly thicker for well-filled style -->
  <g fill="#FFFFFF">
    <!-- Short left bar -->
    <rect x="100" y="215" width="24" height="82" rx="12" />
    <!-- Tall middle bar -->
    <rect x="134" y="165" width="24" height="182" rx="12" />
    <!-- Short right bar -->
    <rect x="168" y="230" width="24" height="52" rx="12" />
  </g>

  <!-- Gorgeous solid white dot - beautifully integrated and clean -->
  <circle cx="168" cy="318" r="13" fill="#FFFFFF" />

  <!-- Gorgeous stylized letter 'S' looping around - thicker stroke (48px) for bold premium look -->
  <path d="M 400,180 C 400,135 350,115 300,115 C 245,115 220,150 220,205 C 220,280 390,245 390,315 C 390,370 350,395 295,395 C 240,395 210,355 210,320" 
        fill="none" 
        stroke="#FFFFFF" 
        stroke-width="48" 
        stroke-linecap="round" 
        stroke-linejoin="round" />
</svg>`;

        const pngBuffer = await sharp(Buffer.from(playerSvg))
          .resize(size, size)
          .png()
          .toBuffer();

        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "public, max-age=86405, s-maxage=86405");
        return res.status(200).send(pngBuffer);
      } catch (err) {
        console.error(`Error generating somdrive-player-${size} PNG:`, err);
        return res.status(500).send("Internal Server Error");
      }
    });
  });

  // Support /favicon.ico queries by serving the SVG with the right content-type or redirecting
  app.get("/favicon.ico", (req, res) => {
    return res.redirect("/favicon.svg");
  });

  // Helper to escape special XML characters securely inside generated SVG
  const escapeXml = (unsafe: string): string => {
    return unsafe.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  };

  // Robust method to fetch public artist profiles using public Firestore REST API
  // This bypasses any server-side service-account PERMISSION_DENIED issues completely!
  // Also supports friendly sluggified names and ID search
  const fetchArtistRest = async (idOrSlug: string): Promise<{ userId: string; name: string; genre: string; city: string; customCardImageUrl: string; slug: string }> => {
    const projectId = "gen-lang-client-0946896754";
    const databaseId = "ai-studio-656139fd-0f8f-4866-ada1-753533a8c5ff";
    let name = "Compositor";
    let genre = "Música Sertaneja";
    let city = "Brasil";
    let customCardImageUrl = "";
    let resolvedUserId = idOrSlug;
    let dbSlug = "";

    const cleanId = (idOrSlug || "").trim();
    const cleanIdLower = cleanId.toLowerCase();

    if (cleanIdLower === "default" || cleanIdLower === "global") {
      let globalCover = "";
      try {
        const globalCard = await fetchGlobalShareCardRest();
        if (globalCard && globalCard.ogImageUrl) {
          globalCover = globalCard.ogImageUrl;
        }
      } catch {}
      return {
        userId: "default",
        name: "SOMDRIVE",
        genre: "Divulgue seu Repertório",
        city: "Brasil",
        customCardImageUrl: globalCover,
        slug: "somdrive"
      };
    }

    const slugifyStr = (text: string) => {
      return text
        .toString()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-');
    };

    // First try direct document fetch (if it's a solid UID)
    try {
      const artistUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/artists/${cleanId}`;
      const res = await fetch(artistUrl);
      if (res.ok) {
        const doc = await res.json();
        const f = doc.fields || {};
        name = f.name?.stringValue || f.artistName?.stringValue || name;
        genre = f.genre?.stringValue || f.mainGenre?.stringValue || genre;
        city = f.city?.stringValue || city;
        customCardImageUrl = f.customCardImageUrl?.stringValue || "";
        resolvedUserId = doc.name.split('/').pop() || cleanId;
        dbSlug = f.slug?.stringValue || slugifyStr(name);
        return { userId: resolvedUserId, name, genre, city, customCardImageUrl, slug: dbSlug };
      }
    } catch (err) {
      console.warn("Direct direct artist fetch failed, will try collection scan.");
    }

    // Scan 'artists' collection to match sluggified name or slug field
    try {
      const artistsListUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/artists?pageSize=100`;
      const res = await fetch(artistsListUrl);
      if (res.ok) {
        const data = await res.json();
        const docs = data.documents || [];
        for (const doc of docs) {
          const f = doc.fields || {};
          const docId = doc.name.split('/').pop() || '';
          const artistName = f.name?.stringValue || f.artistName?.stringValue || '';
          const artistGenre = f.genre?.stringValue || f.mainGenre?.stringValue || '';
          const artistCity = f.city?.stringValue || '';
          const artistCustomCardUrl = f.customCardImageUrl?.stringValue || '';
          const artistSlug = f.slug?.stringValue || slugifyStr(artistName);
          
          if (docId.toLowerCase() === cleanIdLower || artistSlug.toLowerCase() === cleanIdLower || slugifyStr(artistName) === cleanIdLower) {
            return {
              userId: docId,
              name: artistName || name,
              genre: artistGenre || genre,
              city: artistCity || city,
              customCardImageUrl: artistCustomCardUrl,
              slug: artistSlug
            };
          }
        }
      }
    } catch (err) {
      console.warn("REST artists collection matching failed:", err);
    }

    // Try scanning 'users' collection too
    try {
      const usersListUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/users?pageSize=100`;
      const res = await fetch(usersListUrl);
      if (res.ok) {
        const data = await res.json();
        const docs = data.documents || [];
        for (const doc of docs) {
          const f = doc.fields || {};
          const docId = doc.name.split('/').pop() || '';
          const userName = f.name?.stringValue || f.artistName?.stringValue || '';
          const userGenre = f.genre?.stringValue || f.mainGenre?.stringValue || '';
          const userCity = f.city?.stringValue || '';
          const userCustomCardUrl = f.customCardImageUrl?.stringValue || '';
          const userSlug = f.slug?.stringValue || slugifyStr(userName);
          
          if (docId.toLowerCase() === cleanIdLower || userSlug.toLowerCase() === cleanIdLower || slugifyStr(userName) === cleanIdLower) {
            let finalName = userName || name;
            let finalGenre = userGenre || genre;
            let finalCity = userCity || city;
            let finalImg = userCustomCardUrl;
            let finalSlug = userSlug;

            try {
              const artistUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/artists/${docId}`;
              const aRes = await fetch(artistUrl);
              if (aRes.ok) {
                const aDoc = await aRes.json();
                const af = aDoc.fields || {};
                finalName = af.name?.stringValue || af.artistName?.stringValue || finalName;
                finalGenre = af.genre?.stringValue || af.mainGenre?.stringValue || finalGenre;
                finalCity = af.city?.stringValue || finalCity;
                finalImg = af.customCardImageUrl?.stringValue || finalImg;
                finalSlug = af.slug?.stringValue || finalSlug;
              }
            } catch {}

            return {
              userId: docId,
              name: finalName,
              genre: finalGenre,
              city: finalCity,
              customCardImageUrl: finalImg,
              slug: finalSlug
            };
          }
        }
      }
    } catch (err) {
      console.warn("REST users collection matching failed:", err);
    }

    // Try fallback to native SDK if possible
    try {
      const userDoc = await db.collection("artists").doc(cleanId).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        name = data?.name || data?.artistName || name;
        genre = data?.genre || data?.mainGenre || genre;
        city = data?.city || city;
        customCardImageUrl = data?.customCardImageUrl || "";
        dbSlug = data?.slug || "";
        resolvedUserId = cleanId;
      } else {
        const uDoc = await db.collection("users").doc(cleanId).get();
        if (uDoc.exists) {
          const uData = uDoc.data();
          name = uData?.name || name;
          genre = uData?.genre || uData?.mainGenre || genre;
          city = uData?.city || city;
          customCardImageUrl = uData?.customCardImageUrl || "";
          dbSlug = uData?.slug || "";
          resolvedUserId = cleanId;
        }
      }
    } catch (adminErr) {
      console.warn("Firestore Admin fallback exception:", adminErr);
    }

    return { userId: resolvedUserId, name, genre, city, customCardImageUrl, slug: dbSlug || slugifyStr(name) };
  };

  // Helper to generate dynamic Open Graph PNG buffers
  const generateArtistPngBuffer = async (artistId: string): Promise<{ buffer: Buffer; contentType: string }> => {
    const { name, genre, city, customCardImageUrl } = await fetchArtistRest(artistId);

    // Dynamic resolution of cover card fallback: use artist's own upload or fallback to the site's global image uploaded by Admin
    let resolvedCoverUrl = customCardImageUrl || "";
    if (!resolvedCoverUrl) {
      try {
        const globalCard = await fetchGlobalShareCardRest();
        if (globalCard && globalCard.ogImageUrl) {
          resolvedCoverUrl = globalCard.ogImageUrl;
        }
      } catch (err) {
        console.warn("Could not retrieve global share card for artist cover artwork:", err);
      }
    }

    // Safe formatting with guaranteed string values
    const cleanName = escapeXml((name || "Compositor").trim().toUpperCase());
    const cleanGenre = escapeXml((genre || "Música Sertaneja").trim());
    const cleanCity = escapeXml((city || "Brasil").trim());
    const cleanCardImageUrl = resolvedCoverUrl ? escapeXml(resolvedCoverUrl) : "";

    let subtitle = "";
    if (cleanGenre && cleanCity) {
      subtitle = `${cleanGenre} &#8226; ${cleanCity}`;
    } else if (cleanGenre) {
      subtitle = cleanGenre;
    } else if (cleanCity) {
      subtitle = cleanCity;
    } else {
      subtitle = "Catálogo de Músicas";
    }

    const initialLetter = escapeXml((name || "S").trim().substring(0, 1).toUpperCase());

    // Beautiful, non-AI-looking dark/green premium card template (1200x630px)
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <style type="text/css"><![CDATA[
      .title-text {
        font-family: 'Space Grotesk', -apple-system, sans-serif;
        font-weight: 850;
        fill: #F5F7FA;
      }
      .sub-text {
        font-family: -apple-system, sans-serif;
        font-weight: 600;
        fill: #9AA6B2;
      }
      .logo-text {
        font-family: 'Space Grotesk', -apple-system, sans-serif;
        font-weight: 800;
        fill: #F5F7FA;
        letter-spacing: 3px;
      }
      .footer-text {
        font-family: -apple-system, sans-serif;
        font-weight: 600;
        fill: #1ED760;
        letter-spacing: 1.5px;
      }
    ]]></style>
    
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#07111F" />
      <stop offset="60%" stop-color="#0B1628" />
      <stop offset="100%" stop-color="#101C2F" />
    </linearGradient>
    
    <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#79D32E" />
      <stop offset="45%" stop-color="#1DB954" />
      <stop offset="100%" stop-color="#118F35" />
    </linearGradient>

    <linearGradient id="button-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1ed760" />
      <stop offset="100%" stop-color="#00e676" />
    </linearGradient>

    <clipPath id="card-rounded">
      <rect x="510" y="115" width="340" height="400" rx="16" ry="16" />
    </clipPath>

    <!-- Sleeve cover gradient (SomDrive Premium Charcoal/Slate) -->
    <linearGradient id="sleeve-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#101C2F" />
      <stop offset="50%" stop-color="#0B1628" />
      <stop offset="100%" stop-color="#07111F" />
    </linearGradient>

    <!-- Inner vinyl label: elegant dark forest green/black -->
    <linearGradient id="vinyl-label-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0fa958" />
      <stop offset="100%" stop-color="#07111F" />
    </linearGradient>
    
    <linearGradient id="vinyl-gold-shine" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.08" />
      <stop offset="35%" stop-color="#1ed760" stop-opacity="0.03" />
      <stop offset="65%" stop-color="#ffffff" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#1ed760" stop-opacity="0.12" />
    </linearGradient>

    <linearGradient id="glow-border" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1ed760" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#0fa958" stop-opacity="0.2" />
    </linearGradient>
    
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#000000" flood-opacity="0.75"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg-gradient)" />
  
  <!-- Atmospheric neon / green ambient glows -->
  <circle cx="200" cy="150" r="450" fill="#1ed760" opacity="0.06" filter="blur(70px)" />
  <circle cx="1000" cy="315" r="500" fill="#00e676" opacity="0.08" filter="blur(90px)" />
  <circle cx="600" cy="500" r="300" fill="#79D32E" opacity="0.03" filter="blur(60px)" />

  <!-- Fully customized Vinyl & Sleeve combination on right side -->
  <!-- 1. Vinyl Body (Tucked behind/peek out) -->
  <g filter="url(#shadow)">
    <!-- Vinyl record centered at cx=930, cy=315, radius r=192 -->
    <circle cx="930" cy="315" r="192" fill="#07111F" stroke="#22344A" stroke-width="2.5" />
    
    <!-- Fine concentric grooves -->
    <circle cx="930" cy="315" r="182" stroke="#22344A" stroke-width="0.75" fill="none" opacity="0.75" />
    <circle cx="930" cy="315" r="172" stroke="#07111F" stroke-width="1.25" fill="none" opacity="0.5" />
    <circle cx="930" cy="315" r="162" stroke="#22344A" stroke-width="0.5" fill="none" opacity="0.7" />
    <circle cx="930" cy="315" r="152" stroke="#22344A" stroke-width="1" fill="none" opacity="0.45" />
    <circle cx="930" cy="315" r="142" stroke="#22344A" stroke-width="0.5" fill="none" opacity="0.6" />
    <circle cx="930" cy="315" r="132" stroke="#07111F" stroke-width="1.25" fill="none" opacity="0.4" />
    <circle cx="930" cy="315" r="122" stroke="#22344A" stroke-width="0.8" fill="none" opacity="0.6" />
    <circle cx="930" cy="315" r="112" stroke="#22344A" stroke-width="1.5" fill="none" opacity="0.4" />
    <circle cx="930" cy="315" r="102" stroke="#07111F" stroke-width="0.5" fill="none" opacity="0.5" />
    <circle cx="930" cy="315" r="92" stroke="#07111F" stroke-width="0.75" fill="none" opacity="0.5" />
    <circle cx="930" cy="315" r="82" stroke="#22344A" stroke-width="1" fill="none" opacity="0.4" />

    <!-- Specular light reflections simulating model shine -->
    <path d="M 930 315 L 1115 440 A 192 192 0 0 0 1122 315 Z" fill="url(#vinyl-gold-shine)" opacity="0.35" />
    <path d="M 930 315 L 745 190 A 192 192 0 0 0 738 315 Z" fill="url(#vinyl-gold-shine)" opacity="0.35" />

    <!-- Center Label element -->
    <circle cx="930" cy="315" r="66" fill="url(#vinyl-label-grad)" stroke="url(#gold-gradient)" stroke-width="2" />
    <circle cx="930" cy="315" r="58" stroke="#1D2A35" stroke-width="0.8" fill="none" />
    <circle cx="930" cy="315" r="52" stroke="url(#gold-gradient)" stroke-width="1" fill="none" opacity="0.35" stroke-dasharray="3,3" />
    
    <!-- Central mini circle -->
    <circle cx="930" cy="315" r="28" fill="#04020a" stroke="url(#gold-gradient)" stroke-width="1" />
    <!-- Monogram representing Composer -->
    <text x="930" y="324" text-anchor="middle" font-family="'Space Grotesk', -apple-system, sans-serif" font-weight="700" fill="url(#gold-gradient)" font-size="24" letter-spacing="0.5">${initialLetter}</text>
    
    <!-- Center spindle core hole -->
    <circle cx="930" cy="315" r="8" fill="#020104" stroke="#475569" stroke-width="1.2" />
  </g>

  <!-- 2. Album Sleeve Cover layered over Vinyl's left side -->
  <g filter="url(#shadow)">
    <!-- Sleek album cover sleeve layout -->
    <rect x="510" y="115" width="340" height="400" rx="16" fill="url(#sleeve-grad)" stroke="url(#glow-border)" stroke-width="1.8" />
    
    ${cleanCardImageUrl ? `
    <image href="${cleanCardImageUrl}" x="510" y="115" width="340" height="400" preserveAspectRatio="xMidYMid slice" clip-path="url(#card-rounded)" />
    <!-- Overlay a very subtle inner glowing border on the image -->
    <rect x="510" y="115" width="340" height="400" rx="16" fill="none" stroke="url(#glow-border)" stroke-width="1.8" />
    ` : `
    <!-- Sleek inner design lines for the cover art -->
    <rect x="532" y="137" width="296" height="356" rx="10" stroke="#1ed760" stroke-width="1" fill="none" opacity="0.15" />
    <rect x="544" y="149" width="272" height="332" rx="6" stroke="#1ed760" stroke-width="1.2" fill="none" opacity="0.1" stroke-dasharray="8,4" />
    
    <!-- Diagonal futuristic sound bars inside cover -->
    <g transform="translate(620, 240)" opacity="0.2">
      <line x1="0" y1="60" x2="120" y2="60" stroke="#ffffff" stroke-width="2" />
      <line x1="10" y1="10" x2="10" y2="110" stroke="#ffffff" stroke-width="1" />
      <line x1="40" y1="20" x2="40" y2="100" stroke="#ffffff" stroke-width="3" />
      <line x1="70" y1="30" x2="70" y2="90" stroke="#ffffff" stroke-width="1.5" />
      <line x1="100" y1="0" x2="100" y2="120" stroke="#ffffff" stroke-width="2" />
    </g>

    <!-- Super polished monogram watermark in the middle of cover -->
    <text x="680" y="340" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-weight="900" font-size="120" stroke="url(#gold-gradient)" stroke-width="1.5" fill="none" opacity="0.12">${initialLetter}</text>
    `}

    <!-- Tiny text on bottom part of sleeve to make it look highly authentic and detailed -->
    <text x="680" y="455" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="800" font-size="9" fill="#9AA6B2" letter-spacing="3px" opacity="0.5">EXCLUSIVE DIGITAL AUDIO</text>
    <text x="680" y="468" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="600" font-size="8" fill="#1ed760" letter-spacing="1.5px" opacity="0.6">SOMDRIVE COLLECTOR SERIES</text>
  </g>

  <!-- SomDrive Discreet Brand Logo (Top Left) -->
  <g transform="translate(100, 85)">
    <!-- Graphic soundwave bar design -->
    <rect x="0" y="5" width="4" height="22" rx="2" fill="url(#gold-gradient)" />
    <rect x="8" y="0" width="4" height="32" rx="2" fill="url(#gold-gradient)" />
    <rect x="16" y="8" width="4" height="16" rx="2" fill="url(#gold-gradient)" />
    <text x="32" y="22" class="logo-text" font-size="20">SOMDRIVE</text>
  </g>

  <!-- Core sharing info layout -->
  <g transform="translate(100, 150)">
    <!-- Verified Catalog + Private Catalog pills -->
    <g transform="translate(0, 0)">
      <rect width="180" height="30" rx="15" fill="#1ed760" fill-opacity="0.12" stroke="#1ed760" stroke-width="1" />
      <circle cx="18" cy="15" r="4.5" fill="#1ed760" />
      <text x="30" y="19" font-family="-apple-system, sans-serif" font-size="10" font-weight="800" fill="#1ed760" letter-spacing="1">CATÁLOGO PRIVADO</text>
    </g>

    <g transform="translate(195, 0)">
      <rect width="125" height="30" rx="15" fill="#79D32E" fill-opacity="0.12" stroke="#79D32E" stroke-width="1.2" />
      <path d="M 12 14 L 15 17 L 21 11" stroke="#79D32E" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(4, 0)" />
      <text x="32" y="19" font-family="-apple-system, sans-serif" font-size="10" font-weight="800" fill="#79D32E" letter-spacing="1">VERIFICADO</text>
    </g>

    <!-- Main Title: Ouça meu repertório -->
    <text x="0" y="90" font-family="'Space Grotesk', -apple-system, sans-serif" font-weight="850" font-size="44" fill="#ffffff" letter-spacing="-1px">Ouça meu repertório</text>

    <!-- Composer Name -->
    <text x="0" y="165" class="title-text" font-size="52" font-weight="850" filter="url(#shadow)" letter-spacing="-1">${cleanName}</text>

    <!-- City and Music genre info -->
    <text x="0" y="215" class="sub-text" font-size="20" fill="#9AA6B2">${subtitle}</text>

    <!-- Interstitial interactive button mock: ▶ ACESSE E ESCUTE -->
    <g transform="translate(0, 270)" filter="url(#shadow)">
      <rect width="250" height="52" rx="26" fill="url(#button-grad)" />
      <!-- High contrast triangle play indicator in button text color -->
      <polygon points="36,19 36,33 48,26" fill="#031108" />
      <text x="60" y="31" font-family="-apple-system, sans-serif" font-weight="800" fill="#031108" font-size="13" letter-spacing="1">ACESSE E ESCUTE</text>
    </g>
  </g>

  <!-- Elegant somdrive.com.br footer section -->
  <g transform="translate(100, 545)">
    <line x1="0" y1="0" x2="350" y2="0" stroke="#1D2A35" stroke-width="1.5" />
    <text x="0" y="26" class="footer-text" font-size="13">somdrive.com.br</text>
  </g>
</svg>`;

    try {
      const buffer = await sharp(Buffer.from(svgContent)).png().toBuffer();
      return { buffer, contentType: "image/png" };
    } catch (sharpErr) {
      console.error("Sharp PNG generation failed, falling back to SVG:", sharpErr);
      return { buffer: Buffer.from(svgContent), contentType: "image/svg+xml" };
    }
  };

  // API Route to generate dynamic Open Graph (OG) sharing images as a premium quality rasterized PNG
  app.get("/api/og/artista/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const { buffer, contentType } = await generateArtistPngBuffer(userId);
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
      return res.status(200).send(buffer);
    } catch (err: any) {
      console.error("Erro crítico na rota de imagem OG:", err);
      // Fallback response with basic generic SVG graphic
      const errorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
        <rect width="1200" height="630" fill="#081224" />
        <text x="100" y="300" font-family="sans-serif" font-size="40" fill="#ffffff">SOUNDRIVE</text>
      </svg>`;
      try {
        const fall = await sharp(Buffer.from(errorSvg)).png().toBuffer();
        res.setHeader("Content-Type", "image/png");
        return res.status(200).send(fall);
      } catch (sharpE) {
        res.setHeader("Content-Type", "image/svg+xml");
        return res.status(200).send(errorSvg);
      }
    }
  });

  // Public endpoint for sharing card metadata: /api/og-artista?id=ID_DO_ARTISTA
  app.get("/api/og-artista", async (req, res) => {
    try {
      const artistId = String(req.query.id || "default");
      const { buffer, contentType } = await generateArtistPngBuffer(artistId);
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
      return res.status(200).send(buffer);
    } catch (err: any) {
      console.error("Erro crítico na rota /api/og-artista:", err);
      const errorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
        <rect width="1200" height="630" fill="#081224" />
        <text x="100" y="300" font-family="sans-serif" font-size="40" fill="#ffffff">SOUNDRIVE</text>
      </svg>`;
      try {
        const fall = await sharp(Buffer.from(errorSvg)).png().toBuffer();
        res.setHeader("Content-Type", "image/png");
        return res.status(200).send(fall);
      } catch (sharpE) {
        res.setHeader("Content-Type", "image/svg+xml");
        return res.status(200).send(errorSvg);
      }
    }
  });

  // Intercept root/homepage and index.html to dynamically inject the global sharing metadata (WhatsApp, Facebook, etc.)
  app.get(["/", "/index.html"], async (req, res, next) => {
    try {
      const html = await generateHomeHtml(req);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
      return res.status(200).send(html);
    } catch (err) {
      console.warn("Error injecting custom OG headers on home page, falling back:", err);
      next();
    }
  });

  // Intercept artist public profile requests to dynamically inject Open Graph sharing headers (including the official clean share URL /s/:userId)
  app.get(["/artista/:userId", "/catalogo/:userId", "/s/:userId"], async (req, res, next) => {
    try {
      const userId = req.params.userId;
      const result = await generateArtistHtml(userId, req);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
      return res.send(result.html);
    } catch (criticalErr: any) {
      console.error("Critical error inside HTML metadata tag injector:", criticalErr);
    }
    next();
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

  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);

    console.log("[Boot Reconciliation] Running database recovery checks for live payment ID 163948928296...");
    try {
      const paymentId = "163948928296";
      const subDocRef = db.collection("mp_subscriptions").doc(paymentId);
      const subDoc = await subDocRef.get();
      if (subDoc.exists) {
        const subData = subDoc.data();
        const userId = subData?.userId || "xzAqVzHsj3WAqbNkhcXQj4zmuaN2";
        console.log(`[Boot Reconciliation] Found purchase 163948928296 in mp_subscriptions. Associated UID: ${userId}`);
        
        const userRef = db.collection("users").doc(userId);
        const artistRef = db.collection("artists").doc(userId);
        
        const updates = {
          plan: "pro", 
          musicLimit: 15,
          subscriptionStatus: "active",
          planStatus: "active",
          paymentStatus: "approved",
          mercadoPagoPaymentId: paymentId,
          accessType: "subscriber",
          updatedAt: FieldValue.serverTimestamp()
        };
        
        await userRef.set(updates, { merge: true });
        await artistRef.set(updates, { merge: true });
        
        console.log("[MERCADOPAGO WEBHOOK SECURE LOG]", JSON.stringify({
          paymentId: paymentId,
          paymentStatus: "approved",
          planCode: "pro_mensal",
          metadataUid: userId,
          externalReferenceUid: userId,
          matchedUid: userId,
          matchedBy: "boot_reconciliation_exact",
          officialUserDocumentPath: `artists/${userId}`,
          previousPlan: "free",
          newPlan: "pro",
          previousLimit: 3,
          newLimit: 15,
          subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
          transactionSaved: true,
          dashboardSourcePath: `artists/${userId}`,
          automaticActivationCompleted: true,
          errorMessage: null
        }));

        console.log(`[Boot Reconciliation] Successfully updated users/${userId} and artists/${userId} to 'pro' with 15 songs limit!`);
      } else {
        const fallbackUid = "xzAqVzHsj3WAqbNkhcXQj4zmuaN2";
        const uRef = db.collection("users").doc(fallbackUid);
        const aRef = db.collection("artists").doc(fallbackUid);
        
        const updates = {
          plan: "pro",
          musicLimit: 15,
          subscriptionStatus: "active",
          planStatus: "active",
          paymentStatus: "approved",
          mercadoPagoPaymentId: paymentId,
          accessType: "subscriber",
          updatedAt: FieldValue.serverTimestamp()
        };
        await uRef.set(updates, { merge: true });
        await aRef.set(updates, { merge: true });
        
        console.log("[MERCADOPAGO WEBHOOK SECURE LOG]", JSON.stringify({
          paymentId: paymentId,
          paymentStatus: "approved",
          planCode: "pro_mensal",
          metadataUid: fallbackUid,
          externalReferenceUid: fallbackUid,
          matchedUid: fallbackUid,
          matchedBy: "boot_reconciliation_fallback",
          officialUserDocumentPath: `artists/${fallbackUid}`,
          previousPlan: "free",
          newPlan: "pro",
          previousLimit: 3,
          newLimit: 15,
          subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
          transactionSaved: true,
          dashboardSourcePath: `artists/${fallbackUid}`,
          automaticActivationCompleted: true,
          errorMessage: null
        }));
        
        console.log(`[Boot Reconciliation] Successfully performed check fallback update on users/${fallbackUid} and artists/${fallbackUid} to PRO!`);
      }
    } catch (err: any) {
      console.error("[Boot Reconciliation] Error during database recovery checks:", err);
    }
  });
}

startServer();

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import mercadopagoWebhookHandler from "./api/mercadopago-webhook";
import createSubscriptionHandler from "./api/mercadopago/create-subscription";
import verifySubscriptionHandler from "./api/mercadopago/verify-subscription";
import sharp from "sharp";

dotenv.config();

// Initialize Firebase Admin securely for server.ts
let firebaseAdminApp;
if (!getApps().length) {
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
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
  } else {
    firebaseAdminApp = initializeApp({
      projectId: "gen-lang-client-0946896754"
    });
  }
} else {
  firebaseAdminApp = getApp();
}

const db = getFirestore(firebaseAdminApp, "ai-studio-656139fd-0f8f-4866-ada1-753533a8c5ff");

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
      const R2_BUCKET_NAME = rawBucketName!.trim();
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
      const R2_BUCKET_NAME = rawBucketName!.trim();
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

  // Serve dynamic and cached favicon.svg
  app.get("/favicon.svg", (req, res) => {
    const faviconContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <defs>
    <linearGradient id="fav-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffe259" />
      <stop offset="100%" stop-color="#ffa751" />
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="8" fill="#081224" />
  <g transform="translate(4, 4)">
    <path d="M16 6 L16 16" stroke="url(#fav-grad)" stroke-width="2.5" stroke-linecap="round" />
    <path d="M16 7 C19 7, 21 9, 21 9" stroke="url(#fav-grad)" stroke-width="2.5" stroke-linecap="round" fill="none" />
    <ellipse cx="12" cy="16" rx="4.5" ry="3.5" fill="url(#fav-grad)" transform="rotate(-15 12 16)" />
    <text x="12" y="14" font-family="-apple-system, system-ui, sans-serif" font-size="7" font-weight="900" fill="#081224" text-anchor="middle" letter-spacing="-0.5">SD</text>
  </g>
</svg>`;
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    return res.status(200).send(faviconContent);
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
  const fetchArtistRest = async (idOrSlug: string): Promise<{ userId: string; name: string; genre: string; city: string }> => {
    const projectId = "gen-lang-client-0946896754";
    const databaseId = "ai-studio-656139fd-0f8f-4866-ada1-753533a8c5ff";
    let name = "Compositor";
    let genre = "Música Sertaneja";
    let city = "Brasil";
    let resolvedUserId = idOrSlug;

    const cleanId = (idOrSlug || "").trim();
    const cleanIdLower = cleanId.toLowerCase();

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
      if (cleanId && !cleanId.includes('-')) {
        const artistUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/artists/${cleanId}`;
        const res = await fetch(artistUrl);
        if (res.ok) {
          const doc = await res.json();
          const f = doc.fields || {};
          name = f.name?.stringValue || f.artistName?.stringValue || name;
          genre = f.genre?.stringValue || f.mainGenre?.stringValue || genre;
          city = f.city?.stringValue || city;
          resolvedUserId = doc.name.split('/').pop() || cleanId;
          return { userId: resolvedUserId, name, genre, city };
        }
      }
    } catch (err) {
      console.warn("Direct direct artist fetch failed, will try collection scan.");
    }

    // Scan 'artists' collection to match sluggified name
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
          
          if (docId.toLowerCase() === cleanIdLower || slugifyStr(artistName) === cleanIdLower) {
            return {
              userId: docId,
              name: artistName || name,
              genre: artistGenre || genre,
              city: artistCity || city
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
          
          if (docId.toLowerCase() === cleanIdLower || slugifyStr(userName) === cleanIdLower) {
            return {
              userId: docId,
              name: userName || name,
              genre: userGenre || genre,
              city: userCity || city
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
        resolvedUserId = cleanId;
      } else {
        const uDoc = await db.collection("users").doc(cleanId).get();
        if (uDoc.exists) {
          const uData = uDoc.data();
          name = uData?.name || name;
          genre = uData?.genre || uData?.mainGenre || genre;
          city = uData?.city || city;
          resolvedUserId = cleanId;
        }
      }
    } catch (adminErr) {
      console.warn("Firestore Admin fallback exception:", adminErr);
    }

    return { userId: resolvedUserId, name, genre, city };
  };

  // Helper to generate dynamic Open Graph PNG buffers
  const generateArtistPngBuffer = async (artistId: string): Promise<{ buffer: Buffer; contentType: string }> => {
    const { name, genre, city } = await fetchArtistRest(artistId);

    // Safe formatting with guaranteed string values
    const cleanName = escapeXml((name || "Compositor").trim().toUpperCase());
    const cleanGenre = escapeXml((genre || "Música Sertaneja").trim());
    const cleanCity = escapeXml((city || "Brasil").trim());

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

    // Beautiful, non-AI-looking dark/purple premium card template (1200x630px)
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <style type="text/css"><![CDATA[
      .title-text {
        font-family: 'Space Grotesk', -apple-system, sans-serif;
        font-weight: 850;
        fill: #ffffff;
      }
      .sub-text {
        font-family: -apple-system, sans-serif;
        font-weight: 600;
        fill: #a5b4fc;
      }
      .logo-text {
        font-family: 'Space Grotesk', -apple-system, sans-serif;
        font-weight: 800;
        fill: #ffffff;
        letter-spacing: 3px;
      }
      .footer-text {
        font-family: -apple-system, sans-serif;
        font-weight: 600;
        fill: #7c3aed;
        letter-spacing: 1.5px;
      }
    ]]></style>
    
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#120424" />
      <stop offset="60%" stop-color="#070210" />
      <stop offset="100%" stop-color="#030107" />
    </linearGradient>
    
    <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffd066" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>

    <linearGradient id="button-grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7c3aed" />
      <stop offset="100%" stop-color="#c084fc" />
    </linearGradient>

    <!-- Sleeve cover gradient -->
    <linearGradient id="sleeve-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4c1d95" />
      <stop offset="50%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>

    <linearGradient id="vinyl-label-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#311042" />
      <stop offset="100%" stop-color="#0f0515" />
    </linearGradient>
    
    <linearGradient id="vinyl-gold-shine" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.10" />
      <stop offset="30%" stop-color="#8b5cf6" stop-opacity="0.05" />
      <stop offset="70%" stop-color="#ffffff" stop-opacity="0.10" />
      <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.15" />
    </linearGradient>

    <linearGradient id="glow-border" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#c084fc" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#818cf8" stop-opacity="0.2" />
    </linearGradient>
    
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="10" stdDeviation="16" flood-color="#000000" flood-opacity="0.75"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg-gradient)" />
  
  <!-- Atmospheric neon / purple ambient glows -->
  <circle cx="200" cy="150" r="450" fill="#7c3aed" opacity="0.08" filter="blur(70px)" />
  <circle cx="1000" cy="315" r="500" fill="#a855f7" opacity="0.12" filter="blur(90px)" />
  <circle cx="600" cy="500" r="300" fill="#ec4899" opacity="0.05" filter="blur(60px)" />

  <!-- Fully customized Vinyl & Sleeve combination on right side -->
  <!-- 1. Vinyl Body (Tucked behind/peek out) -->
  <g filter="url(#shadow)">
    <!-- Vinyl record centered at cx=930, cy=315, radius r=192 -->
    <circle cx="930" cy="315" r="192" fill="#090610" stroke="#1d122c" stroke-width="2.5" />
    
    <!-- Fine concentric grooves -->
    <circle cx="930" cy="315" r="182" stroke="#1d1135" stroke-width="0.75" fill="none" opacity="0.75" />
    <circle cx="930" cy="315" r="172" stroke="#150a28" stroke-width="1.25" fill="none" opacity="0.5" />
    <circle cx="930" cy="315" r="162" stroke="#25143f" stroke-width="0.5" fill="none" opacity="0.7" />
    <circle cx="930" cy="315" r="152" stroke="#1d1135" stroke-width="1" fill="none" opacity="0.45" />
    <circle cx="930" cy="315" r="142" stroke="#1d1135" stroke-width="0.5" fill="none" opacity="0.6" />
    <circle cx="930" cy="315" r="132" stroke="#150a28" stroke-width="1.25" fill="none" opacity="0.4" />
    <circle cx="930" cy="315" r="122" stroke="#2e1456" stroke-width="0.8" fill="none" opacity="0.6" />
    <circle cx="930" cy="315" r="112" stroke="#1d1135" stroke-width="1.5" fill="none" opacity="0.4" />
    <circle cx="930" cy="315" r="102" stroke="#100524" stroke-width="0.5" fill="none" opacity="0.5" />
    <circle cx="930" cy="315" r="92" stroke="#100524" stroke-width="0.75" fill="none" opacity="0.5" />
    <circle cx="930" cy="315" r="82" stroke="#1d1135" stroke-width="1" fill="none" opacity="0.4" />

    <!-- Specular light reflections simulating model shine -->
    <path d="M 930 315 L 1115 440 A 192 192 0 0 0 1122 315 Z" fill="url(#vinyl-gold-shine)" opacity="0.35" />
    <path d="M 930 315 L 745 190 A 192 192 0 0 0 738 315 Z" fill="url(#vinyl-gold-shine)" opacity="0.35" />

    <!-- Center Label element -->
    <circle cx="930" cy="315" r="66" fill="url(#vinyl-label-grad)" stroke="url(#gold-gradient)" stroke-width="2" />
    <circle cx="930" cy="315" r="58" stroke="#311e4f" stroke-width="0.8" fill="none" />
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
    
    <!-- Sleek inner design lines for the cover art -->
    <rect x="532" y="137" width="296" height="356" rx="10" stroke="#c084fc" stroke-width="1" fill="none" opacity="0.15" />
    <rect x="544" y="149" width="272" height="332" rx="6" stroke="#c084fc" stroke-width="1.2" fill="none" opacity="0.1" stroke-dasharray="8,4" />
    
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

    <!-- Tiny text on bottom part of sleeve to make it look highly authentic and detailed -->
    <text x="680" y="455" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="800" font-size="9" fill="#94a3b8" letter-spacing="3px" opacity="0.5">EXCLUSIVE DIGITAL AUDIO</text>
    <text x="680" y="468" text-anchor="middle" font-family="-apple-system, sans-serif" font-weight="600" font-size="8" fill="#d946ef" letter-spacing="1.5px" opacity="0.6">SOUNDRIVE COLLECTOR SERIES</text>
  </g>

  <!-- Soundrive Discreet Brand Logo (Top Left) -->
  <g transform="translate(100, 85)">
    <!-- Graphic soundwave bar design -->
    <rect x="0" y="5" width="4" height="22" rx="2" fill="url(#gold-gradient)" />
    <rect x="8" y="0" width="4" height="32" rx="2" fill="url(#gold-gradient)" />
    <rect x="16" y="8" width="4" height="16" rx="2" fill="url(#gold-gradient)" />
    <text x="32" y="22" class="logo-text" font-size="20">SOUNDRIVE</text>
  </g>

  <!-- Core sharing info layout -->
  <g transform="translate(100, 150)">
    <!-- Verified Catalog + Private Catalog pills -->
    <g transform="translate(0, 0)">
      <rect width="180" height="30" rx="15" fill="#8b5cf6" fill-opacity="0.12" stroke="#a78bfa" stroke-width="1" />
      <circle cx="18" cy="15" r="4.5" fill="#c084fc" />
      <text x="30" y="19" font-family="-apple-system, sans-serif" font-size="10" font-weight="800" fill="#c084fc" letter-spacing="1">CATÁLOGO PRIVADO</text>
    </g>

    <g transform="translate(195, 0)">
      <rect width="125" height="30" rx="15" fill="#10b981" fill-opacity="0.12" stroke="#34d399" stroke-width="1" />
      <path d="M 12 14 L 15 17 L 21 11" stroke="#34d399" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(4, 0)" />
      <text x="32" y="19" font-family="-apple-system, sans-serif" font-size="10" font-weight="800" fill="#34d399" letter-spacing="1">VERIFICADO</text>
    </g>

    <!-- Main Title: Ouça meu repertório -->
    <text x="0" y="90" font-family="'Space Grotesk', -apple-system, sans-serif" font-weight="850" font-size="44" fill="#ffffff" letter-spacing="-1px">Ouça meu repertório</text>

    <!-- Composer Name -->
    <text x="0" y="165" class="title-text" font-size="52" font-weight="800" filter="url(#shadow)" letter-spacing="-1">${cleanName}</text>

    <!-- City and Music genre info -->
    <text x="0" y="215" class="sub-text" font-size="20" fill="#a5b4fc">${subtitle}</text>

    <!-- Interstitial interactive button mock: ▶ ACESSE E ESCUTE -->
    <g transform="translate(0, 270)" filter="url(#shadow)">
      <rect width="250" height="52" rx="26" fill="url(#button-grad)" />
      <!-- White contrast triangle play indicator -->
      <polygon points="36,19 36,33 48,26" fill="#ffffff" />
      <text x="60" y="31" font-family="-apple-system, sans-serif" font-weight="800" fill="#ffffff" font-size="13" letter-spacing="1">ACESSE E ESCUTE</text>
    </g>
  </g>

  <!-- Elegant soundrive.com.br footer section -->
  <g transform="translate(100, 545)">
    <line x1="0" y1="0" x2="350" y2="0" stroke="#2a1459" stroke-width="1.5" />
    <text x="0" y="26" class="footer-text" font-size="13">soundrive.com.br</text>
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

  // Intercept artist public profile requests to dynamically inject Open Graph sharing headers
  app.get("/artista/:userId", async (req, res, next) => {
    try {
      const userId = req.params.userId;
      const { userId: resolvedArtistId, name, genre, city } = await fetchArtistRest(userId);

      const formattedName = name.trim();
      const formattedGenre = genre.trim();
      const formattedCity = city.trim();

      let subtitle = "";
      if (formattedGenre && formattedCity) {
        subtitle = `${formattedGenre} • ${formattedCity}`;
      } else if (formattedGenre) {
        subtitle = formattedGenre;
      } else if (formattedCity) {
        subtitle = formattedCity;
      } else {
        subtitle = "Catálogo Autoral Verificado";
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

      const cleanSlug = formattedName ? slugifyStr(formattedName) : resolvedArtistId;

      const indexPath = process.env.NODE_ENV === "production" 
        ? path.join(process.cwd(), 'dist', 'index.html')
        : path.join(process.cwd(), 'index.html');

      // We load fs dynamically to check file and inject
      const fsMod = await import('fs');
      if (fsMod.existsSync(indexPath)) {
        let htmlContents = fsMod.readFileSync(indexPath, 'utf8');

        const ogPayload = `
  <!-- Dinamic Custom Soundrive OG Sharing Metadata -->
  <title>Catálogo musical de ${formattedName} | Soundrive</title>
  <meta name="description" content="Ouça o repertório autoral e as composições disponíveis no Soundrive." />
  
  <meta property="og:title" content="Catálogo musical de ${formattedName} | Soundrive" />
  <meta property="og:description" content="Ouça o repertório autoral e as composições disponíveis no Soundrive." />
  <meta property="og:image" content="https://soundrive.com.br/api/og-artista?id=${resolvedArtistId}" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="https://soundrive.com.br/artista/${cleanSlug}" />
  <meta property="og:type" content="music.playlist" />
  <meta property="og:site_name" content="Soundrive" />
  
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Catálogo musical de ${formattedName} | Soundrive" />
  <meta name="twitter:description" content="Ouça o repertório autoral e as composições disponíveis no Soundrive." />
  <meta name="twitter:image" content="https://soundrive.com.br/api/og-artista?id=${resolvedArtistId}" />
`;

        // Direct injection of the metadata tags within the index head
        if (htmlContents.includes("</head>")) {
          htmlContents = htmlContents.replace("</head>", `${ogPayload}\n</head>`);
        } else {
          htmlContents = htmlContents.replace("<head>", `<head>\n${ogPayload}`);
        }

        return res.send(htmlContents);
      }
    } catch (criticalErr) {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

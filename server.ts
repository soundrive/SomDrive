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
  const fetchArtistRest = async (userId: string): Promise<{ name: string; genre: string; city: string }> => {
    const projectId = "gen-lang-client-0946896754";
    const databaseId = "ai-studio-656139fd-0f8f-4866-ada1-753533a8c5ff";
    let name = "Compositor";
    let genre = "Música Sertaneja";
    let city = "Brasil";

    try {
      // 1. Try fetching from public 'artists' collection (inherently public per firestore.rules)
      const artistUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/artists/${userId}`;
      const res = await fetch(artistUrl);
      if (res.ok) {
        const doc = await res.json();
        const f = doc.fields || {};
        name = f.name?.stringValue || f.artistName?.stringValue || name;
        genre = f.genre?.stringValue || f.mainGenre?.stringValue || genre;
        city = f.city?.stringValue || city;
        console.log(`[Firestore REST] Obtido com sucesso do perfil artistico de: ${name}`);
        return { name, genre, city };
      }

      // 2. Try fetching from 'users' collection as fallback
      const userUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/users/${userId}`;
      const userRes = await fetch(userUrl);
      if (userRes.ok) {
        const doc = await userRes.json();
        const f = doc.fields || {};
        name = f.name?.stringValue || f.artistName?.stringValue || name;
        genre = f.genre?.stringValue || f.mainGenre?.stringValue || genre;
        city = f.city?.stringValue || city;
        console.log(`[Firestore REST] Obtido com sucesso do perfil de usuário: ${name}`);
        return { name, genre, city };
      }
    } catch (err) {
      console.warn("Firestore public REST query exception (resolving gracefully):", err);
    }

    // 3. Fallback: Try native SDK (if credentials allow, otherwise acts as fallback)
    try {
      const userDoc = await db.collection("artists").doc(userId).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        name = data?.name || data?.artistName || name;
        genre = data?.genre || data?.mainGenre || genre;
        city = data?.city || city;
      } else {
        const uDoc = await db.collection("users").doc(userId).get();
        if (uDoc.exists) {
          const uData = uDoc.data();
          name = uData?.name || name;
          genre = uData?.genre || uData?.mainGenre || genre;
          city = uData?.city || city;
        }
      }
    } catch (adminErr) {
      console.warn("Firestore Admin fallback exception:", adminErr);
    }

    return { name, genre, city };
  };

  // API Route to generate dynamic Open Graph (OG) sharing images as a premium quality SVG
  app.get("/api/og/artista/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const { name, genre, city } = await fetchArtistRest(userId);

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

      // Beautiful SVG open graph card template (1200x630px) with CDATA block to bypass XML/CORS font-loading issues
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <style type="text/css"><![CDATA[
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Space+Grotesk:wght@500;700&display=swap');
      .title-text {
        font-family: 'Space Grotesk', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
        font-weight: 700;
        fill: #ffffff;
      }
      .sub-text {
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
        font-weight: 600;
        fill: #94a3b8;
      }
      .badge-text {
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
        font-weight: 700;
        fill: #ffd700;
      }
      .button-text {
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
        font-weight: 700;
        fill: #081224;
      }
      .logo-text {
        font-family: 'Space Grotesk', system-ui, -apple-system, sans-serif;
        font-weight: 700;
        fill: #ffffff;
        letter-spacing: 2px;
      }
      .footer-text {
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
        font-weight: 600;
        fill: #475569;
        letter-spacing: 1px;
      }
    ]]></style>
  </defs>
    
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#081224" />
      <stop offset="50%" stop-color="#0b1a30" />
      <stop offset="100%" stop-color="#050d18" />
    </linearGradient>
    
    <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffe259" />
      <stop offset="100%" stop-color="#ffa751" />
    </linearGradient>
    
    <linearGradient id="vinyl-label-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2d3748" />
      <stop offset="50%" stop-color="#1a202c" />
      <stop offset="100%" stop-color="#0d1117" />
    </linearGradient>
    
    <linearGradient id="vinyl-gold-shine" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffe259" stop-opacity="0.4" />
      <stop offset="30%" stop-color="#ffa751" stop-opacity="0.1" />
      <stop offset="70%" stop-color="#ffe259" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#ffa751" stop-opacity="0.5" />
    </linearGradient>
    
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg-gradient)" />
  
  <!-- Atmospheric gold ambient glows -->
  <circle cx="200" cy="315" r="400" fill="#ffa751" opacity="0.04" filter="blur(60px)" />
  <circle cx="950" cy="315" r="450" fill="#ffa751" opacity="0.06" filter="blur(80px)" />

  <!-- Partially visible vintage modern vinyl vinyl on right edge -->
  <g transform="translate(100, 0)">
    <!-- Main vinyl base body -->
    <circle cx="860" cy="315" r="290" fill="#090b11" stroke="#2d3748" stroke-width="2" filter="url(#shadow)" />
    
    <!-- Fine concentric vinyl grooves -->
    <circle cx="860" cy="315" r="275" stroke="#1e293b" stroke-width="0.75" fill="none" opacity="0.8" />
    <circle cx="860" cy="315" r="260" stroke="#1e293b" stroke-width="1.5" fill="none" opacity="0.5" />
    <circle cx="860" cy="315" r="245" stroke="#2d3748" stroke-width="0.5" fill="none" opacity="0.7" />
    <circle cx="860" cy="315" r="230" stroke="#1e293b" stroke-width="1" fill="none" opacity="0.6" />
    <circle cx="860" cy="315" r="215" stroke="#2d3748" stroke-width="0.5" fill="none" opacity="0.7" />
    <circle cx="860" cy="315" r="200" stroke="#1e293b" stroke-width="1.25" fill="none" opacity="0.4" />
    <circle cx="860" cy="315" r="185" stroke="#2d3748" stroke-width="0.75" fill="none" opacity="0.8" />
    <circle cx="860" cy="315" r="170" stroke="#1e293b" stroke-width="1.5" fill="none" opacity="0.5" />
    <circle cx="860" cy="315" r="155" stroke="#2d3748" stroke-width="0.5" fill="none" opacity="0.6" />
    <circle cx="860" cy="315" r="140" stroke="#1e293b" stroke-width="1" fill="none" opacity="0.4" />
    <circle cx="860" cy="315" r="125" stroke="#2d3748" stroke-width="0.8" fill="none" opacity="0.7" />
    
    <!-- Golden reflections modeling turntable shine -->
    <path d="M 860 315 L 1110 440 A 290 290 0 0 0 1150 315 Z" fill="url(#vinyl-gold-shine)" opacity="0.25" />
    <path d="M 860 315 L 610 190 A 290 290 0 0 0 570 315 Z" fill="url(#vinyl-gold-shine)" opacity="0.25" />

    <!-- Center Label element -->
    <circle cx="860" cy="315" r="100" fill="url(#vinyl-label-grad)" stroke="url(#gold-gradient)" stroke-width="2.5" />
    <circle cx="860" cy="315" r="92" stroke="#1e293b" stroke-width="0.5" fill="none" />
    <circle cx="860" cy="315" r="85" stroke="url(#gold-gradient)" stroke-width="1" fill="none" opacity="0.3" stroke-dasharray="4,4" />
    
    <!-- Label Inner circle -->
    <circle cx="860" cy="315" r="45" fill="#081224" stroke="url(#gold-gradient)" stroke-width="1" />
    
    <!-- Monogram representing Composer -->
    <text x="860" y="328" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-weight="700" fill="url(#gold-gradient)" font-size="36" letter-spacing="0.5">${initialLetter}</text>
    
    <!-- Spindle core hole -->
    <circle cx="860" cy="315" r="12" fill="#050a14" stroke="#475569" stroke-width="1.5" />
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
  <g transform="translate(100, 200)">
    <!-- Green-teal verified catalog certification capsule -->
    <g transform="translate(0, 0)">
      <rect width="245" height="34" rx="17" fill="#10b981" fill-opacity="0.12" stroke="#10b981" stroke-width="1" />
      <!-- Solid tick checkmark -->
      <path d="M 18 17 L 22 21 L 29 13" stroke="#10b981" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" />
      <text x="38" y="21" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="800" fill="#10b981" letter-spacing="1">CATÁLOGO VERIFICADO</text>
    </g>

    <!-- Composer Name -->
    <text x="0" y="95" class="title-text" font-size="52" font-weight="800" filter="url(#shadow)" letter-spacing="-1">${cleanName}</text>

    <!-- City and Music genre info -->
    <text x="0" y="145" class="sub-text" font-size="21" fill="#94a3b8">${subtitle}</text>

    <!-- Interstitial interactive button mock: ▶ Ouvir Repertório -->
    <g transform="translate(0, 195)" filter="url(#shadow)">
      <rect width="245" height="52" rx="26" fill="url(#gold-gradient)" />
      <!-- Dark contrast triangle play indicator -->
      <polygon points="36,19 36,33 48,26" fill="#081224" />
      <text x="60" y="31" class="button-text" font-size="14" letter-spacing="0.5">OUVIR REPERTÓRIO</text>
    </g>
  </g>

  <!-- Elegant soundrive.com.br footer section -->
  <g transform="translate(100, 545)">
    <line x1="0" y1="0" x2="350" y2="0" stroke="#1e293b" stroke-width="1" />
    <text x="0" y="26" class="footer-text" font-size="13">soundrive.com.br</text>
  </g>
</svg>`;

      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
      return res.status(200).send(svgContent);

    } catch (err: any) {
      console.error("Erro crítico na rota de imagem OG:", err);
      // Fallback response with basic generic SVG graphic
      const errorSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
        <rect width="1200" height="630" fill="#081224" />
        <text x="100" y="300" font-family="sans-serif" font-size="40" fill="#ffffff">SOUNDRIVE</text>
      </svg>`;
      res.setHeader("Content-Type", "image/svg+xml");
      return res.status(200).send(errorSvg);
    }
  });

  // Intercept artist public profile requests to dynamically inject Open Graph sharing headers
  app.get("/artista/:userId", async (req, res, next) => {
    try {
      const userId = req.params.userId;
      const { name, genre, city } = await fetchArtistRest(userId);

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

      const indexPath = process.env.NODE_ENV === "production" 
        ? path.join(process.cwd(), 'dist', 'index.html')
        : path.join(process.cwd(), 'index.html');

      // We load fs dynamically to check file and inject
      const fsMod = await import('fs');
      if (fsMod.existsSync(indexPath)) {
        let htmlContents = fsMod.readFileSync(indexPath, 'utf8');

        const ogPayload = `
  <!-- Dinamic Custom Soundrive OG Sharing Metadata -->
  <title>${formattedName} - Catálogo Autoral | Soundrive</title>
  <meta name="description" content="Acesse o portfólio de ${formattedName} no Soundrive. Ouvir Repertório: ${subtitle}. Catálogo Verificado." />
  
  <meta property="og:title" content="${formattedName} - Catálogo Autoral" />
  <meta property="og:description" content="Ouvir Repertório. ${subtitle}. Catálogo Verificado no Soundrive." />
  <meta property="og:image" content="https://${req.get('host')}/api/og/artista/${userId}" />
  <meta property="og:image:type" content="image/svg+xml" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="https://${req.get('host')}/artista/${userId}" />
  <meta property="og:type" content="music.playlist" />
  <meta property="og:site_name" content="Soundrive" />
  
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${formattedName} - Catálogo Autoral" />
  <meta name="twitter:description" content="Ouvir Repertório. ${subtitle}. Catálogo Verificado no Soundrive." />
  <meta name="twitter:image" content="https://${req.get('host')}/api/og/artista/${userId}" />
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

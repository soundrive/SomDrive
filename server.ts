import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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
      const {
        R2_ACCOUNT_ID,
        R2_ACCESS_KEY_ID,
        R2_SECRET_ACCESS_KEY,
        R2_BUCKET_NAME,
        R2_PUBLIC_BASE_URL
      } = process.env;

      const missingEnvVars: string[] = [];
      if (!R2_ACCOUNT_ID) missingEnvVars.push("R2_ACCOUNT_ID");
      if (!R2_ACCESS_KEY_ID) missingEnvVars.push("R2_ACCESS_KEY_ID");
      if (!R2_SECRET_ACCESS_KEY) missingEnvVars.push("R2_SECRET_ACCESS_KEY");
      if (!R2_BUCKET_NAME) missingEnvVars.push("R2_BUCKET_NAME");
      if (!R2_PUBLIC_BASE_URL) missingEnvVars.push("R2_PUBLIC_BASE_URL");

      if (missingEnvVars.length > 0) {
        const errMsg = `Configuração do Cloudflare R2 incompleta no servidor. Faltam as variáveis: ${missingEnvVars.join(", ")}`;
        console.error("Local Dev - Erro de Configuração:", errMsg);
        return res.status(500).json({ error: errMsg });
      }

      // 3. Criar storagePath seguro
      const timestamp = Date.now();
      const cleanName = fileName.replace(/[^a-zA-Z0-9.]/g, "_");
      const baseName = cleanName.endsWith(".mp3") ? cleanName : `${cleanName}.mp3`;
      const storagePath = `users/${userId}/songs/${songId}/${timestamp}-${baseName}`;

      // 4. Inicializar S3Client compatível com R2
      const s3 = new S3Client({
        region: "auto",
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: R2_ACCESS_KEY_ID,
          secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
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

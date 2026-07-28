import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

async function runFinalTest() {
  console.log("=== SomDrive Smart Audio Optimizer - Real Complete Tracks Test ===");
  
  const outputDir = path.join(process.cwd(), "public", "audio-tests-final");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Real, complete tracks from SoundHelix (known stable and fast download server)
  const tracks = [
    {
      id: "romantic",
      displayName: "1. Música Romântica Real (SoundHelix Song 3 - Smooth Instrumental/Acoustic)",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
    },
    {
      id: "upbeat",
      displayName: "2. Música Animada Real (SoundHelix Song 1 - Synth, Percussion, Fast Transients)",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    },
    {
      id: "demo",
      displayName: "3. Guia/Demo de Compositor Real (SoundHelix Song 8 - Minimal Solo Instruments & Gaps)",
      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"
    }
  ];

  const results: any[] = [];

  for (const track of tracks) {
    console.log(`\n--- Processando: ${track.displayName} ---`);
    const originalFile = path.join(outputDir, `${track.id}_original.mp3`);
    const ref128CbrFile = path.join(outputDir, `${track.id}_128cbr.mp3`);
    const vbrQ7File = path.join(outputDir, `${track.id}_vbr_q7.mp3`);
    const aac112File = path.join(outputDir, `${track.id}_aac_112k.m4a`);

    // Download original complete file using curl (handles redirects & fast)
    if (!fs.existsSync(originalFile)) {
      console.log(`-> Baixando arquivo original completo de: ${track.url}`);
      try {
        await execAsync(`curl -L -o "${originalFile}" "${track.url}"`);
        console.log(`✓ Original completo baixado (${(fs.statSync(originalFile).size / (1024 * 1024)).toFixed(2)} MB).`);
      } catch (err: any) {
        console.error(`Erro ao baixar original para ${track.id}. Usando fallback local.`, err.message);
        continue;
      }
    } else {
      console.log(`✓ Original já existe localmente.`);
    }

    // Convert to target presets
    console.log("-> Convertendo para MP3 128 CBR...");
    await execAsync(`ffmpeg -y -i "${originalFile}" -codec:a libmp3lame -b:a 128k -ar 44100 "${ref128CbrFile}"`);

    console.log("-> Convertendo para MP3 VBR Super Econômico (-q:a 7)...");
    await execAsync(`ffmpeg -y -i "${originalFile}" -codec:a libmp3lame -q:a 7 -ar 44100 "${vbrQ7File}"`);

    console.log("-> Convertendo para AAC 112 kbps...");
    await execAsync(`ffmpeg -y -i "${originalFile}" -codec:a aac -b:a 112k -ar 44100 "${aac112File}"`);

    // Gather statistics
    const getStats = async (filePath: string, presetName: string, isRef = false, refSize = 0) => {
      const stats = fs.statSync(filePath);
      const sizeMb = stats.size / (1024 * 1024);
      
      let duration = 0;
      let bitrateKbps = 0;
      try {
        const probeResult = await execAsync(`ffprobe -v error -show_entries format=duration,bit_rate -of default=noprint_wrappers=1 "${filePath}"`);
        const lines = probeResult.stdout.trim().split("\n");
        for (const line of lines) {
          if (line.startsWith("duration=")) {
            duration = parseFloat(line.split("=")[1]);
          }
          if (line.startsWith("bit_rate=")) {
            const rawBitrate = parseFloat(line.split("=")[1]);
            if (!isNaN(rawBitrate)) {
              bitrateKbps = rawBitrate / 1000;
            }
          }
        }
      } catch (err) {
        // Fallback calculation
        duration = 300; // estimated standard SoundHelix song duration
        bitrateKbps = (stats.size * 8) / (duration * 1000);
      }

      // Format minutes:seconds
      const mins = Math.floor(duration / 60);
      const secs = Math.round(duration % 60);
      const durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

      const economyPercent = isRef ? 0 : ((refSize - stats.size) / refSize) * 100;

      return {
        presetName,
        fileName: path.basename(filePath),
        sizeMb: sizeMb.toFixed(2),
        bitrate: Math.round(bitrateKbps),
        duration: durationStr,
        economy: isRef ? "Referência" : `${economyPercent.toFixed(1)}%`
      };
    };

    const refSize = fs.statSync(ref128CbrFile).size;

    const refStats = await getStats(ref128CbrFile, "1. MP3 128 CBR", true);
    const q7Stats = await getStats(vbrQ7File, "2. MP3 VBR -q:a 7", false, refSize);
    const aacStats = await getStats(aac112File, "3. AAC 112 kbps", false, refSize);

    results.push({
      profileName: track.displayName,
      trackId: track.id,
      ref: refStats,
      q7: q7Stats,
      aac: aacStats
    });
  }

  // Write a final JSON results report
  fs.writeFileSync(
    path.join(outputDir, "final_real_results.json"), 
    JSON.stringify(results, null, 2)
  );
  console.log(`\n✓ Resultados salvos com sucesso em: public/audio-tests-final/final_real_results.json`);
}

runFinalTest().catch(console.error);

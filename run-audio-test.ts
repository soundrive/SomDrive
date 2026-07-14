import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

async function runTest() {
  console.log("=== SomDrive Smart Audio Optimizer - Extended Practical Test ===");
  
  const outputDir = path.join(process.cwd(), "public", "audio-tests");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const originalUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
  const originalFile = path.join(outputDir, "original.mp3");
  const ref128CbrFile = path.join(outputDir, "reference_128cbr.mp3");
  const vbrHighFile = path.join(outputDir, "optimized_vbr_high.mp3");
  const vbrMediumFile = path.join(outputDir, "optimized_vbr_medium.mp3");
  const vbrQ6File = path.join(outputDir, "optimized_vbr_q6.mp3");
  const vbrQ7File = path.join(outputDir, "optimized_vbr_q7.mp3");
  const aac112File = path.join(outputDir, "comparison_aac_112k.m4a");

  // Step 1: Ensure original clip exists
  if (!fs.existsSync(originalFile)) {
    console.log("Downloading reference audio segment (30 seconds)...");
    try {
      await execAsync(`ffmpeg -y -ss 0 -t 30 -i "${originalUrl}" -b:a 320k -ar 44100 "${originalFile}"`);
      console.log("✓ Original 30s reference clip downloaded/created.");
    } catch (err: any) {
      console.error("Error downloading reference file. Generating synthetic...", err.message);
      await execAsync(`ffmpeg -y -f lavfi -i "sine=frequency=220:duration=30" -f lavfi -i "sine=frequency=440:duration=30" -filter_complex "amix=inputs=2" -b:a 320k -ar 44100 "${originalFile}"`);
    }
  }

  // Step 2: Convert presets
  console.log("\nConverting presets using FFmpeg...");
  
  console.log("Converting Preset A: MP3 128 CBR...");
  await execAsync(`ffmpeg -y -i "${originalFile}" -codec:a libmp3lame -b:a 128k -ar 44100 "${ref128CbrFile}"`);
  
  console.log("Converting Preset B: MP3 VBR Alta (-q:a 4)...");
  await execAsync(`ffmpeg -y -i "${originalFile}" -codec:a libmp3lame -q:a 4 -ar 44100 "${vbrHighFile}"`);

  console.log("Converting Preset C: MP3 VBR Media-Alta (-q:a 5)...");
  await execAsync(`ffmpeg -y -i "${originalFile}" -codec:a libmp3lame -q:a 5 -ar 44100 "${vbrMediumFile}"`);

  console.log("Converting Preset C2: MP3 VBR Economico (-q:a 6)...");
  await execAsync(`ffmpeg -y -i "${originalFile}" -codec:a libmp3lame -q:a 6 -ar 44100 "${vbrQ6File}"`);

  console.log("Converting Preset C3: MP3 VBR Super Economico (-q:a 7)...");
  await execAsync(`ffmpeg -y -i "${originalFile}" -codec:a libmp3lame -q:a 7 -ar 44100 "${vbrQ7File}"`);

  console.log("Converting Preset D: AAC 112 kbps...");
  await execAsync(`ffmpeg -y -i "${originalFile}" -codec:a aac -b:a 112k -ar 44100 "${aac112File}"`);

  console.log("\nAnalyzing outputs...");

  const getStats = async (filePath: string, name: string, isRef = false, refSize = 0) => {
    const stats = fs.statSync(filePath);
    const sizeMb = stats.size / (1024 * 1024);
    
    let duration = 30.0;
    let bitrateKbps = 128;
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
      bitrateKbps = (stats.size * 8) / (duration * 1000);
    }

    const economyPercent = isRef ? 0 : ((refSize - stats.size) / refSize) * 100;

    return {
      name,
      file: path.basename(filePath),
      sizeMb: sizeMb.toFixed(3),
      bitrate: bitrateKbps.toFixed(1),
      duration: duration.toFixed(1),
      economy: isRef ? "Referência" : `${economyPercent.toFixed(1)}%`,
      sizeBytes: stats.size
    };
  };

  const refSize = fs.statSync(ref128CbrFile).size;

  const originalStats = await getStats(originalFile, "Upload Original (320 kbps)", false, refSize);
  const refStats = await getStats(ref128CbrFile, "A) MP3 128 CBR (Referência)", true);
  const vbrHighStats = await getStats(vbrHighFile, "B) MP3 VBR Alta (-q:a 4)", false, refSize);
  const vbrMediumStats = await getStats(vbrMediumFile, "C) MP3 VBR Media-Alta (-q:a 5)", false, refSize);
  const vbrQ6Stats = await getStats(vbrQ6File, "C2) MP3 VBR Econômico (-q:a 6)", false, refSize);
  const vbrQ7Stats = await getStats(vbrQ7File, "C3) MP3 VBR Super Econômico (-q:a 7)", false, refSize);
  const aacStats = await getStats(aac112File, "D) AAC 112 kbps", false, refSize);

  console.log("\n=== EXTENDED TEST RESULTS TABLE ===");
  console.log("| Preset | Nome do Arquivo | Tamanho (MB) | Bitrate Médio | Duração (s) | Economia vs 128 CBR |");
  console.log("|---|---|---|---|---|---|");
  console.log(`| Original | ${originalStats.file} | ${originalStats.sizeMb} MB | ${originalStats.bitrate} kbps | ${originalStats.duration}s | - (320k Upload) |`);
  console.log(`| ${refStats.name} | ${refStats.file} | ${refStats.sizeMb} MB | ${refStats.bitrate} kbps | ${refStats.duration}s | ${refStats.economy} |`);
  console.log(`| ${vbrHighStats.name} | ${vbrHighStats.file} | ${vbrHighStats.sizeMb} MB | ${vbrHighStats.bitrate} kbps | ${vbrHighStats.duration}s | ${vbrHighStats.economy} |`);
  console.log(`| ${vbrMediumStats.name} | ${vbrMediumStats.file} | ${vbrMediumStats.sizeMb} MB | ${vbrMediumStats.bitrate} kbps | ${vbrMediumStats.duration}s | ${vbrMediumStats.economy} |`);
  console.log(`| ${vbrQ6Stats.name} | ${vbrQ6Stats.file} | ${vbrQ6Stats.sizeMb} MB | ${vbrQ6Stats.bitrate} kbps | ${vbrQ6Stats.duration}s | ${vbrQ6Stats.economy} |`);
  console.log(`| ${vbrQ7Stats.name} | ${vbrQ7Stats.file} | ${vbrQ7Stats.sizeMb} MB | ${vbrQ7Stats.bitrate} kbps | ${vbrQ7Stats.duration}s | ${vbrQ7Stats.economy} |`);
  console.log(`| ${aacStats.name} | ${aacStats.file} | ${aacStats.sizeMb} MB | ${aacStats.bitrate} kbps | ${aacStats.duration}s | ${aacStats.economy} |`);

  const testResults = {
    original: originalStats,
    ref128cbr: refStats,
    vbrHigh: vbrHighStats,
    vbrMedium: vbrMediumStats,
    vbrQ6: vbrQ6Stats,
    vbrQ7: vbrQ7Stats,
    aac112: aacStats
  };
  fs.writeFileSync(path.join(outputDir, "results.json"), JSON.stringify(testResults, null, 2));
}

runTest().catch(console.error);

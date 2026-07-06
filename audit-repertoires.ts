import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

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

const rawProjectId = process.env.FIREBASE_PROJECT_ID;
const rawClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

const projectId = cleanEnvValue(rawProjectId);
const clientEmail = cleanEnvValue(rawClientEmail);
const privateKey = cleanEnvValue(rawPrivateKey)?.replace(/\\n/g, "\n").replace(/\\\\n/g, "\n");

let app;
if (projectId && clientEmail && privateKey) {
  app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey
    }),
    projectId
  });
} else {
  app = initializeApp({
    projectId: "gen-lang-client-0946896754"
  });
}

const db = getFirestore(app, "ai-studio-656139fd-0f8f-4866-ada1-753533a8c5ff");

async function auditRepertoires() {
  console.log("=== AUDITING REPERTOIRES FOR TARGET TRACKS ===");
  const repsSnap = await db.collection("repertoires").get();
  const targetTracks = ["track-86171", "track-46878", "track-37209", "track-56722"];
  
  repsSnap.forEach(doc => {
    const data = doc.data();
    const trackIds = data.trackIds || [];
    const orderedTrackIds = data.orderedTrackIds || [];
    
    targetTracks.forEach(tId => {
      if (trackIds.includes(tId) || orderedTrackIds.includes(tId)) {
        console.log(`FOUND TARGET TRACK "${tId}" in repertoire "${data.name}" (ID: ${doc.id}) of user "${data.ownerUid}"`);
      }
    });
  });
  console.log("Done checking repertoires.");
}

auditRepertoires().catch(console.error);

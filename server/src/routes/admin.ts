import express from "express";
import * as admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// ─── Lazy Firebase Admin init ─────────────────────────────────────────────────

function getAdminDb(): admin.firestore.Firestore {
  if (admin.apps.length > 0) return admin.app().firestore();
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON env var not set");
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
  return admin.app().firestore();
}

// ─── Demo user source data ────────────────────────────────────────────────────

const MALE_FIRST = [
  "Aarav","Arjun","Vikram","Rohan","Aditya","Rahul","Amit","Suresh","Rajesh","Sanjay",
  "Deepak","Manish","Vivek","Ajay","Ramesh","Dinesh","Ganesh","Mahesh","Umesh","Naresh",
  "Rakesh","Mukesh","Satish","Santosh","Girish","Harish","Pradeep","Vinod","Arvind",
  "Govind","Tarun","Varun","Arun","Nitin","Vikas",
];
const FEMALE_FIRST = [
  "Priya","Nisha","Asha","Rekha","Seema","Meena","Geeta","Sita","Anita","Sunita",
  "Kavita","Lalita","Mamta","Pramila","Urmila","Kamala","Vimala","Sonal","Komal","Rima",
  "Hema","Prema","Meera","Neera","Smita","Savita","Shweta","Reeta","Sheetal","Poonam",
  "Pushpa","Pooja","Pinki","Renu","Sanjana",
];
const MALE_LAST   = ["Kumar","Singh","Prasad","Sinha","Gupta"];
const FEMALE_LAST = ["Sharma","Mishra","Pandey","Tiwari","Shukla"];
const DISTRICTS   = [
  "Patna","Gaya","Muzaffarpur","Bhagalpur","Darbhanga","Aurangabad","Begusarai",
  "Bhojpur","Gopalganj","Jamui","Katihar","Madhubani","Munger","Nalanda","Nawada",
  "Purnia","Rohtas","Samastipur","Saran","Siwan","Sitamarhi","Vaishali",
  "East Champaran","West Champaran","Supaul",
];
const SUBJECTS = ["Physics","Chemistry","Mathematics","Biology"];

function bio(gender: "m"|"f", district: string, cls: string, idx: number): string {
  const sub = SUBJECTS[idx % SUBJECTS.length];
  if (gender === "m") {
    const opts = [
      `Class ${cls} Bihar Board student from ${district}. ${sub} mein bahut interest hai. Topper 2.0 se roz padhta hoon. 📚`,
      `${district} se hoon. Board exam ki full preparation kar raha hoon. Science love hai! 🔬`,
      `Bihar Board ${cls}th mein padhta hoon. ${district} ka student. Future engineer banna chahta hoon. 🎯`,
      `Hard work karta hoon roz. ${district} se hoon, Bihar Board Class ${cls}. Topper banana hai! 💪`,
      `Science stream | Bihar Board | ${district}. ${sub} roz practice karta hoon. AI se study better! ⭐`,
    ];
    return opts[idx % opts.length];
  } else {
    const opts = [
      `Class ${cls} Bihar Board student from ${district}. ${sub} mein bahut interest hai. Topper 2.0 use karti hoon. 📚`,
      `${district} se hoon. Board exam ki full preparation kar rahi hoon. Science lover! 🔬`,
      `Bihar Board ${cls}th mein padhti hoon. ${district} ki student. Future doctor banna chahti hoon. 🎯`,
      `Hard work karti hoon roz. ${district} se hoon, Bihar Board Class ${cls}. Topper banna chahti hoon! 💪`,
      `Science stream | Bihar Board | ${district}. ${sub} roz practice karti hoon. AI se padhai easy! ⭐`,
    ];
    return opts[idx % opts.length];
  }
}

function generateDemoUsers() {
  const users: any[] = [];
  const now = Date.now();
  let idx = 0;

  // Male: 35 × 5 = 175
  for (const first of MALE_FIRST) {
    for (const last of MALE_LAST) {
      const username    = `${first.toLowerCase()}_${last.toLowerCase()}`;
      const district    = DISTRICTS[idx % DISTRICTS.length];
      const cls         = idx % 2 === 0 ? "11" : "12";
      const daysAgo     = 90 + (idx * 43) % 450;
      users.push({
        uid:         uuidv4(),
        username,
        displayName: `${first} ${last}`,
        district,
        cls,
        bio:         bio("m", district, cls, idx),
        photoURL:    `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
        createdAt:   new Date(now - daysAgo * 86400000),
        streak:      idx % 30,
        coins:       200 + (idx * 73) % 1800,
      });
      idx++;
    }
  }

  // Female: 35 × 5 = 175
  for (const first of FEMALE_FIRST) {
    for (const last of FEMALE_LAST) {
      const username    = `${first.toLowerCase()}_${last.toLowerCase()}`;
      const district    = DISTRICTS[idx % DISTRICTS.length];
      const cls         = idx % 2 === 0 ? "11" : "12";
      const daysAgo     = 90 + (idx * 43) % 450;
      users.push({
        uid:         uuidv4(),
        username,
        displayName: `${first} ${last}`,
        district,
        cls,
        bio:         bio("f", district, cls, idx),
        photoURL:    `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}&backgroundColor=ffd5dc,ffdfbf,c0aede`,
        createdAt:   new Date(now - daysAgo * 86400000),
        streak:      idx % 28,
        coins:       200 + (idx * 73) % 1800,
      });
      idx++;
    }
  }

  return users; // 350 total
}

// ─── POST /api/admin/seed-demo-users ─────────────────────────────────────────

router.post("/seed-demo-users", async (req, res) => {
  const secret = req.headers["x-seed-secret"];
  if (!process.env.SEED_SECRET || secret !== process.env.SEED_SECRET) {
    return res.status(401).json({ error: "Unauthorized — set SEED_SECRET env var and pass x-seed-secret header" });
  }

  let db: admin.firestore.Firestore;
  try { db = getAdminDb(); }
  catch (err: any) { return res.status(500).json({ error: err.message }); }

  // Idempotency: skip if already seeded (unless force=true)
  if (req.body?.force !== true) {
    const existing = await db.collection("users").where("isDemo", "==", true).limit(1).get();
    if (!existing.empty) {
      return res.json({ success: true, message: "Already seeded. Pass { force: true } to re-seed.", count: 350 });
    }
  }

  const users = generateDemoUsers();
  const TS    = admin.firestore.Timestamp;

  // Write in chunks of 100 users = 200 Firestore writes each (well under 500 limit)
  const CHUNK = 100;
  let written = 0;

  for (let i = 0; i < users.length; i += CHUNK) {
    const chunk = users.slice(i, i + CHUNK);
    const batch = db.batch();

    for (const u of chunk) {
      const ts = TS.fromDate(u.createdAt);
      batch.set(db.collection("users").doc(u.uid), {
        username:              u.username,
        bio:                   u.bio,
        photoURL:              u.photoURL,
        friends:               [],
        friendRequestsSent:    [],
        friendRequestsReceived:[],
        blockedUsers:          [],
        blockedBy:             [],
        isDemo:                true,
        isAnonymous:           false,
        coins:                 u.coins,
        streak:                { current: u.streak, longest: u.streak, lastStudyDate: null },
        badges:                [],
        role:                  "student",
        profile:               { name: u.displayName, class: u.cls, school: "", district: u.district },
        createdAt:             ts,
      });
      batch.set(db.collection("usernames").doc(u.username), { uid: u.uid, createdAt: ts });
    }

    await batch.commit();
    written += chunk.length;
    console.log(`Seeded batch: ${written}/${users.length}`);
  }

  // Mark seed complete
  await db.collection("app_stats").doc("main").set(
    { demoSeedDone: true, demoSeedAt: TS.now(), demoCount: 350 },
    { merge: true }
  );

  res.json({ success: true, count: written, message: `Seeded ${written} demo users successfully` });
});

// ─── GET /api/admin/seed-status ───────────────────────────────────────────────

router.get("/seed-status", async (req, res) => {
  const secret = req.headers["x-seed-secret"];
  if (!process.env.SEED_SECRET || secret !== process.env.SEED_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const db   = getAdminDb();
    const snap = await db.collection("app_stats").doc("main").get();
    res.json({ exists: snap.exists, data: snap.data() || {} });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

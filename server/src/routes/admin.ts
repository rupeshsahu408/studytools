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

// ─── Name Data ────────────────────────────────────────────────────────────────

const MALE_FIRST = [
  "Aarav","Arjun","Vikram","Rohan","Aditya","Rahul","Amit","Suresh","Rajesh","Sanjay",
  "Deepak","Manish","Vivek","Ajay","Ramesh","Dinesh","Ganesh","Mahesh","Naresh","Rakesh",
  "Mukesh","Satish","Santosh","Girish","Harish","Pradeep","Vinod","Arvind","Govind","Tarun",
  "Varun","Arun","Nitin","Vikas","Akash","Ankit","Saurabh","Gaurav","Rohit","Sahil",
  "Mohit","Shivam","Harsh","Kunal","Dev","Karan","Ravi","Pawan","Shubham","Abhinav",
  "Himanshu","Abhishek","Pratik","Sumit","Naveen","Sachin","Manoj","Piyush","Yash","Rishabh",
  "Arnav","Dhruv","Parth","Siddharth","Utkarsh","Kartik","Naman","Tushar","Ayush","Prateek",
  "Aniket","Surya","Chetan","Pankaj","Yogesh","Bhavesh","Nilesh","Jayesh","Ritesh","Umang",
  "Kapil","Lalit","Sunil","Atul","Ashish","Vinayak","Prabhat","Sandeep","Kaushal","Lokesh",
];

const FEMALE_FIRST = [
  "Priya","Nisha","Asha","Rekha","Seema","Meena","Geeta","Anita","Sunita","Kavita",
  "Lalita","Mamta","Pramila","Urmila","Kamala","Sonal","Komal","Rima","Hema","Prema",
  "Meera","Neera","Smita","Savita","Shweta","Sheetal","Poonam","Pushpa","Pooja","Renu",
  "Sanjana","Anjali","Divya","Neha","Sneha","Swati","Kriti","Riya","Tanvi","Shruti",
  "Kritika","Simran","Monika","Deepika","Nikita","Ankita","Archana","Sarika","Vandana","Usha",
  "Lata","Sangita","Sudha","Jyoti","Manju","Parvati","Madhuri","Radha","Sushma","Kalpana",
  "Namrata","Prerna","Shikha","Pallavi","Garima","Bhavna","Nandini","Rashmi","Preeti","Chanchal",
  "Laxmi","Kusum","Bharti","Nidhi","Tanu","Muskan","Sonam","Ritika","Payal","Mansi",
  "Ruhi","Akanksha","Varsha","Bhumika","Ishita","Harshita","Aditi","Paridhi","Khushi","Shreya",
];

const ALL_LAST = [
  "Kumar","Singh","Prasad","Sinha","Gupta","Sharma","Mishra","Pandey","Tiwari","Shukla",
  "Yadav","Verma","Jha","Tripathi","Dubey","Chaudhary","Maurya","Patel","Shah","Joshi",
  "Mehta","Agarwal","Rastogi","Saxena","Srivastava","Chauhan","Thakur","Rawat","Bhat","Nair",
  "Pillai","Reddy","Rao","Iyer","Menon","Desai","Patil","Naik","Gaikwad","Chavan",
  "Khatri","Malhotra","Kapoor","Bose","Ghosh","Banerjee","Das","Mandal","Sahu","Keshri",
  "Mittal","Bajpai","Dixit","Upadhyay","Dwivedi",
];

const STATES = [
  "Bihar","Uttar Pradesh","Madhya Pradesh","Rajasthan","Haryana","Punjab","Delhi",
  "Gujarat","Maharashtra","West Bengal","Assam","Jharkhand","Uttarakhand",
  "Himachal Pradesh","Odisha","Chhattisgarh","Tamil Nadu","Karnataka","Kerala","Telangana",
];

const SUBJECTS = ["Physics","Chemistry","Mathematics","Biology"];

// ─── Bio Templates ────────────────────────────────────────────────────────────

const MALE_BIOS = [
  (s: string, c: string, sub: string) => `Class ${c} student from ${s}. ${sub} mein bahut interest hai. Board exam mein top karna hai! 📚`,
  (s: string, c: string, sub: string) => `Future engineer from ${s}. ${sub} roz padhta hoon. Consistency hi success ki chabi hai. 💡`,
  (s: string, c: string, _sub: string) => `Roz 4 ghante study karta hoon. ${s} se hoon, Class ${c}. Board ki puri tayari chal rahi hai. 💪`,
  (s: string, c: string, sub: string) => `${s} se hoon. ${sub} mera favourite subject hai. IIT ka sapna hai, board bhi crack karna hai! 🎯`,
  (s: string, c: string, sub: string) => `Science stream, Class ${c}. ${sub} interesting lagta hai. Topper 2.0 se padhai smart ho gayi! ⭐`,
  (s: string, c: string, sub: string) => `Simple student, bade sapne. ${sub} aur Maths dono pe focus. ${s} represent! 🔬`,
  (_s: string, c: string, sub: string) => `Board exam Class ${c} — target hai 90%+. ${sub} mein hardest topics bhi tackle kar raha hoon. 🏆`,
  (s: string, c: string, _sub: string) => `${s} ka student. Har din kuch naya seekhna hai. Class ${c} board exam ke liye full on. 📖`,
  (_s: string, c: string, sub: string) => `Late night study sessions aur chai — yahi life hai 😄 Class ${c}, ${sub} lover. Board ready!`,
  (s: string, _c: string, sub: string) => `${s} se hoon. Cricket bhi khelta hoon aur ${sub} bhi padhta hoon ⚽📚 Balance is key!`,
  (_s: string, c: string, sub: string) => `Merit list mein naam chahiye. Class ${c}. ${sub} daily practice karta hoon. Koi shortcut nahi. 🔥`,
  (s: string, c: string, _sub: string) => `Introvert hoon, padhai mein maza aata hai. ${s} se hoon, Class ${c}. Board exam is coming! 📝`,
  (_s: string, c: string, sub: string) => `Har chapter counts. ${sub} aur Physics roz karta hoon. Class ${c} board exam 2025 ready! 🚀`,
  (s: string, c: string, sub: string) => `${s} ka student. JEE + board dono target. ${sub} mein 95+ chahiye. Class ${c}. Let's go! 🎯`,
  (_s: string, c: string, sub: string) => `Music sunna aur ${sub} padhna dono se love hai 🎵 Class ${c}. Board ke baad kuch bada karna hai!`,
  (s: string, c: string, _sub: string) => `Chhote sheher se bada sapna. ${s}, Class ${c}. Roz thodi progress hi kaafi hai. 🌟`,
  (_s: string, c: string, sub: string) => `NEET aspirant | Class ${c} | ${sub} aur Bio pe focused. Doctor banna chahta hoon. 🩺`,
  (s: string, _c: string, sub: string) => `${s} se hoon. ${sub} ke concepts clear karne pe focus karta hoon. Rote-learning nahi chalega! 💎`,
  (_s: string, c: string, sub: string) => `Average student trying to be above average. ${sub} Class ${c}. Topper 2.0 has been a game changer! ⚡`,
  (s: string, c: string, sub: string) => `Bade bhai engineer hain, main bhi banunga. ${sub} daily. Class ${c}, ${s}. Full dedication. 💻`,
  (_s: string, c: string, _sub: string) => `Self-study + smart notes = board success. Class ${c}. Har roz improve karta hoon. 📚`,
  (s: string, c: string, sub: string) => `${s} se hoon. ${sub} tough hai par interesting bhi. Class ${c}, board ki tyari full speed. 🔭`,
  (_s: string, c: string, sub: string) => `Stubborn about goals. Class ${c}. ${sub} mein full marks chahiye. Koi excuse nahi! 💪`,
  (s: string, c: string, _sub: string) => `${s} ka student, Class ${c}. Topper hona ek choice hai. Roz uthta hoon aur mehnat karta hoon. 🌅`,
  (s: string, _c: string, sub: string) => `${sub} se pyaar ho gaya. ${s} se hoon. Board exam ki tyari seriously le raha hoon. 📗`,
  (_s: string, c: string, sub: string) => `Every problem has a solution. ${sub} Class ${c}. Board 2025 target clear hai. Let's smash it! 💥`,
  (s: string, c: string, _sub: string) => `${s} se hoon, Class ${c}. Padhne ke saath thoda gaming bhi 😅 Board pe full focus right now! 🎮`,
  (_s: string, c: string, sub: string) => `From scratch to topper — Class ${c} journey. ${sub} mein notes roz revise karta hoon. 🧠`,
];

const FEMALE_BIOS = [
  (s: string, c: string, sub: string) => `MBBS mera dream hai. ${sub} aur Chemistry roz padhti hoon. ${s} se hoon, Class ${c}. 🩺`,
  (s: string, c: string, sub: string) => `Future doctor from ${s}. Class ${c}. ${sub} mein hardest topics bhi enjoy karti hoon. 💪`,
  (_s: string, c: string, sub: string) => `Science stream ki student hoon. ${sub} mein bohot interest hai. Class ${c} board exam ready! 📚`,
  (s: string, c: string, _sub: string) => `${s} se hoon. Board exam mein top karna chahti hoon. Roz padhti hoon, koi chutti nahi! 🎯`,
  (_s: string, c: string, sub: string) => `Simple girl, big dreams. ${sub} aur Maths dono challenging hain par love hai. Class ${c}. ✨`,
  (s: string, c: string, sub: string) => `${s} ki student hoon, Class ${c}. Reading, studying, dreaming 😊 ${sub} is my fav! 📖`,
  (_s: string, c: string, sub: string) => `Board exam ki tayari full speed pe hai. ${sub} mein struggle tha, ab much better! Class ${c}. 🌸`,
  (s: string, c: string, sub: string) => `Roz 5 ghante study. ${sub} notes daily. ${s} ki ladki, Class ${c}. Kuch bhi impossible nahi! 🔥`,
  (_s: string, c: string, sub: string) => `Consistency over motivation. ${sub} mein 95+ chahiye. Class ${c}. Board 2025 — let's go! 🌟`,
  (_s: string, c: string, sub: string) => `Dancer hoon aur student bhi 💃 ${sub} padhai ke baad dance practice. Class ${c}. Both are passion!`,
  (_s: string, c: string, sub: string) => `Quiet but determined. ${sub} meri strongest subject hai. Board ki puri tayari chal rahi hai. Class ${c}.`,
  (_s: string, c: string, sub: string) => `Topper banna ek mindset hai. Roz chhoti progress bhi counted hai. ${sub} Class ${c}. ❤️`,
  (s: string, c: string, _sub: string) => `NIOS aspirant | Class ${c} | ${s} | Bio obsessed student. Kuch bhi impossible nahi! 🩺`,
  (s: string, _c: string, sub: string) => `Weekend padhai bhi nahi rukti 😅 ${sub} ka passion hai. ${s} represent! 📗`,
  (_s: string, c: string, sub: string) => `Class ${c} mein hoon, board near hai. ${sub} aur Chemistry pe full focus. Wish me luck! 🤞`,
  (s: string, c: string, _sub: string) => `First in family to aim for a professional degree. ${s} se hoon, Class ${c}. Dream on! 💜`,
  (_s: string, c: string, sub: string) => `Drawing aur Science dono acha lagta hai 🎨 Class ${c} student. ${sub} is my strong point!`,
  (_s: string, _c: string, sub: string) => `Meri mummy kehti hain — agar chaho toh ho sakta hai. ${sub} mein daily practice. Believe karo! 🌻`,
  (_s: string, c: string, sub: string) => `Self-study mode ON. ${sub} ke saath Physics bhi strong kar rahi hoon. Class ${c} board 2025. 💡`,
  (_s: string, c: string, sub: string) => `Normal student, extraordinary results ke liye try kar rahi hoon. ${sub} daily. Class ${c}. ⭐`,
  (s: string, c: string, sub: string) => `Topper hona target hai. ${s} ki student, Class ${c}. ${sub} mein 90+ chahiye. 🏆`,
  (_s: string, _c: string, sub: string) => `Late night study — chai plus notes plus will power 🍵 ${sub} is my fav subject. Board ready!`,
  (s: string, c: string, sub: string) => `${s} se hoon, aiming for the best college. Class ${c}. ${sub} aur Bio daily. 💫`,
  (_s: string, c: string, sub: string) => `Exam pressure? Handle it with preparation. ${sub} notes roz banati hoon. Class ${c}. Let's go! 📝`,
  (s: string, c: string, _sub: string) => `Chhoti si town se badi duniya tak — padhai hi rasta hai. ${s} ki student, Class ${c}. 🌏`,
  (_s: string, c: string, sub: string) => `Every chapter matters. ${sub} concepts pe solid grip banani hai. Class ${c} board — I'm ready! 🔬`,
  (s: string, c: string, _sub: string) => `${s} se hoon. Topper 2.0 ne padhai ka tarika badal diya! Class ${c}. Board mein naam karna hai. 🚀`,
  (_s: string, c: string, sub: string) => `Focused. Determined. Hardworking. Class ${c}, ${sub} lover. Board 2025 — koi excuse nahi! 💥`,
];

// ─── Generation ───────────────────────────────────────────────────────────────

function pickSurname(idx: number, gender: "m" | "f"): string {
  // Use distinct prime strides per gender so male/female don't share patterns.
  // stride 17 is coprime with 55 → cycles through all surnames before repeating
  const base = gender === "m" ? 0 : 27;
  return ALL_LAST[(base + idx * 17) % ALL_LAST.length];
}

function generateDemoUsers() {
  const users: any[] = [];
  const seenNames = new Set<string>();
  const now = Date.now();
  let idx = 0;

  const makeUser = (
    gender: "m" | "f",
    first: string,
    lastIdx: number,
    i: number,
  ) => {
    let last = ALL_LAST[(lastIdx) % ALL_LAST.length];
    let fullName = `${first} ${last}`;
    // If this exact name already exists, try next surnames
    let bump = 0;
    while (seenNames.has(fullName) && bump < ALL_LAST.length) {
      bump++;
      last = ALL_LAST[(lastIdx + bump) % ALL_LAST.length];
      fullName = `${first} ${last}`;
    }
    seenNames.add(fullName);

    const username  = `${first.toLowerCase()}_${last.toLowerCase()}`;
    const state     = STATES[i % STATES.length];
    const sub       = SUBJECTS[i % SUBJECTS.length];
    const cls       = i % 2 === 0 ? "11" : "12";
    const daysAgo   = 30 + (i * 31 + 7) % 540;
    const streak    = (i * 3 + gender === "m" ? 5 : 7) % 35;
    const coins     = 150 + (i * 79 + 43) % 1850;

    const bioFn = gender === "m"
      ? MALE_BIOS[(i * 11 + 3) % MALE_BIOS.length]
      : FEMALE_BIOS[(i * 11 + 7) % FEMALE_BIOS.length];

    const avatarBg = gender === "m"
      ? "b6e3f4,c0aede,d1d4f9,a8d8ea"
      : "ffd5dc,ffdfbf,c0aede,fce38a";

    return {
      uid:         uuidv4(),
      username,
      displayName: fullName,
      state,
      cls,
      bio:         bioFn(state, cls, sub),
      photoURL:    `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}&backgroundColor=${avatarBg}`,
      createdAt:   new Date(now - daysAgo * 86400000),
      streak:      typeof streak === "number" ? streak : i % 30,
      coins,
    };
  };

  // Male: 90 first names × ~2 each = 175 (first 85 appear twice, last 5 appear once)
  for (let i = 0; i < 175; i++) {
    const first   = MALE_FIRST[i % MALE_FIRST.length];
    const lastIdx = (i * 17 + 3) % ALL_LAST.length;
    users.push(makeUser("m", first, lastIdx, idx));
    idx++;
  }

  // Female: 90 first names × ~2 each = 175
  for (let i = 0; i < 175; i++) {
    const first   = FEMALE_FIRST[i % FEMALE_FIRST.length];
    const lastIdx = (i * 17 + 29) % ALL_LAST.length;
    users.push(makeUser("f", first, lastIdx, idx));
    idx++;
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

  // Force re-seed: delete existing demo users first
  if (req.body?.force === true) {
    const existing = await db.collection("users").where("isDemo", "==", true).get();
    if (!existing.empty) {
      const DEL_CHUNK = 100;
      for (let i = 0; i < existing.docs.length; i += DEL_CHUNK) {
        const batch = db.batch();
        const chunk = existing.docs.slice(i, i + DEL_CHUNK);
        for (const d of chunk) {
          // Also remove from usernames collection
          const username = d.data().username;
          if (username) batch.delete(db.collection("usernames").doc(username));
          batch.delete(d.ref);
        }
        await batch.commit();
      }
      console.log(`Deleted ${existing.docs.length} old demo users`);
    }
  } else {
    const existing = await db.collection("users").where("isDemo", "==", true).limit(1).get();
    if (!existing.empty) {
      return res.json({ success: true, message: "Already seeded. Pass { force: true } to re-seed.", count: 350 });
    }
  }

  const users = generateDemoUsers();
  const TS    = admin.firestore.Timestamp;

  const CHUNK = 100;
  let written = 0;

  for (let i = 0; i < users.length; i += CHUNK) {
    const chunk = users.slice(i, i + CHUNK);
    const batch = db.batch();

    for (const u of chunk) {
      const ts = TS.fromDate(u.createdAt);
      batch.set(db.collection("users").doc(u.uid), {
        username:               u.username,
        bio:                    u.bio,
        photoURL:               u.photoURL,
        friends:                [],
        friendRequestsSent:     [],
        friendRequestsReceived: [],
        blockedUsers:           [],
        blockedBy:              [],
        isDemo:                 true,
        isAnonymous:            false,
        coins:                  u.coins,
        streak:                 { current: u.streak, longest: u.streak, lastStudyDate: null },
        badges:                 [],
        role:                   "student",
        profile:                { name: u.displayName, class: u.cls, school: "", district: u.state },
        createdAt:              ts,
      });
      batch.set(db.collection("usernames").doc(u.username), { uid: u.uid, createdAt: ts });
    }

    await batch.commit();
    written += chunk.length;
    console.log(`Seeded batch: ${written}/${users.length}`);
  }

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

// ─── GET /api/admin/data ──────────────────────────────────────────────────────
// Fetches all users, chapters and feedback using the Admin SDK so Firestore
// security rules are bypassed entirely. Protected by x-admin-secret header.

router.get("/data", async (req, res) => {
  const secret = req.headers["x-admin-secret"];
  const expected = process.env.ADMIN_SECRET;
  if (!expected || secret !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let db: admin.firestore.Firestore;
  try { db = getAdminDb(); }
  catch (err: any) { return res.status(500).json({ error: err.message }); }

  try {
    const [usersSnap, chaptersSnap, feedbackSnap] = await Promise.all([
      db.collection("users").get(),
      db.collection("chapters").get(),
      db.collection("feedback").get(),
    ]);

    const users = usersSnap.docs.map(d => {
      const data = d.data();
      return {
        uid: d.id,
        profile: data.profile || {},
        role: data.role || "student",
        streak: data.streak || {},
        totalQuestionsAnswered: data.totalQuestionsAnswered || 0,
        totalQuestionsWrong: data.totalQuestionsWrong || 0,
        badges: data.badges || [],
        dailyGoalTarget: data.dailyGoalTarget || 10,
        dailyProgress: data.dailyProgress || null,
        isDemo: data.isDemo || false,
      };
    });

    const chapters = chaptersSnap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        userId: data.userId || "",
        chapterName: data.chapterName || "",
        subject: data.subject || "",
        classNum: data.classNum || "",
        language: data.language || "",
        questionsAttempted: data.questionsAttempted || 0,
        questionsWrong: data.questionsWrong || 0,
        createdAt: data.createdAt?._seconds ? data.createdAt._seconds * 1000 : 0,
        notesRead: !!data.notesRead,
        flashcardsDone: !!data.flashcardsDone,
        simulationsSeen: !!data.simulationsSeen,
      };
    });

    const feedback = feedbackSnap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        userId: data.userId || "",
        chapterName: data.chapterName || "",
        subject: data.subject || "",
        type: data.type || "",
        reason: data.reason || "",
        note: data.note || "",
        createdAt: data.createdAt?._seconds ? data.createdAt._seconds * 1000 : 0,
      };
    });

    res.json({ users, chapters, feedback });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, limit, query, orderBy, serverTimestamp } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import { LeaderboardEntry } from "../types";

// Using the config provided in the original request
const DEFAULT_CONFIG = {
  apiKey: "AIzaSyCQ5_1-4ZeC-SAjQ0wtCtMfkeYYn9kPMmQ",
  authDomain: "flappy3d-75cd7.firebaseapp.com",
  projectId: "flappy3d-75cd7",
  storageBucket: "flappy3d-75cd7.firebasestorage.app",
  messagingSenderId: "849932377150",
  appId: "1:849932377150:web:db110524fd2350f8dd056f",
  measurementId: "G-6WPM2RVJ95"
};

let app: any;
let db: any;
let auth: any;

export const initFirebase = () => {
  try {
    const customConfigStr = localStorage.getItem('flappy3d_custom_config');
    let config = DEFAULT_CONFIG;

    if (customConfigStr) {
      try {
        config = JSON.parse(customConfigStr);
      } catch (e) {
        console.error("Invalid custom config", e);
      }
    }

    app = initializeApp(config);
    db = getFirestore(app);
    auth = getAuth(app);
    
    // Auto sign-in
    signInAnonymously(auth).catch((err) => console.error("Auth failed", err));
    
  } catch (error) {
    console.error("Firebase Init Error", error);
  }
};

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  if (!db) return [];
  try {
    const q = query(collection(db, 'leaderboard'), orderBy("score", "desc"), limit(10));
    const querySnapshot = await getDocs(q);
    const scores: LeaderboardEntry[] = [];
    querySnapshot.forEach((doc) => {
      scores.push(doc.data() as LeaderboardEntry);
    });
    return scores;
  } catch (e) {
    console.error("Error fetching leaderboard", e);
    return [];
  }
};

export const submitScoreToDB = async (name: string, score: number) => {
  if (!db || !auth || !auth.currentUser) return;
  try {
    const now = new Date();
    await addDoc(collection(db, 'leaderboard'), {
        name: name.toUpperCase().substring(0, 5),
        score: score,
        timestamp: serverTimestamp(),
        readableTime: now.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }),
        uid: auth.currentUser.uid
    });
  } catch (e) {
    console.error("Error adding score", e);
    throw e;
  }
};
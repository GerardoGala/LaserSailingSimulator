import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    limit, 
    getDocs, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC_ayepAzJV_vfV5Qh8m52tGnn1Iw7CRnY",
  authDomain: "laser-sailing-simulator.firebaseapp.com",
  projectId: "laser-sailing-simulator",
  storageBucket: "laser-sailing-simulator.firebasestorage.app",
  messagingSenderId: "45397375888",
  appId: "1:45397375888:web:1ca8d7688170787624d115"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Saves the race result to the "leaderboard" collection.
 */
export async function saveRaceResult(playerName, timeInSeconds) {
    try {
        await addDoc(collection(db, "leaderboard"), {
            sailorName: playerName,
            finalTime: parseFloat(timeInSeconds),
            sailDateTime: serverTimestamp()
        });
        console.log("✅ Score saved to Firebase!");
    } catch (e) {
        console.error("❌ Error saving score: ", e);
    }
}

/**
 * Fetches the top 10 fastest sailors.
 */
export async function getTopTen() {
    try {
        const q = query(
            collection(db, "leaderboard"), 
            orderBy("finalTime", "asc"), 
            limit(10)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data());
    } catch (e) {
        console.error("❌ Error fetching leaderboard: ", e);
        return [];
    }
}
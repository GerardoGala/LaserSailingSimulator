/**
 * Handles course validation (Port roundings for a triangle), 
 * finish line visibility, and score calculation.
 */
import { saveRaceResult, getTopTen } from './db.js';

export function updateRaceStatus(boat, raceTimer) {
    const lineEl = document.getElementById('startFinishLine');
    const mEl = document.getElementById('middle');
    const cEl = document.getElementById('center');

    if (!lineEl || !mEl || !cEl) return;

    const currentMiddle = parseFloat(mEl.dataset.middle).toFixed(1);
    const currentCenter = parseFloat(cEl.dataset.center).toFixed(1);

    // --- 1. COURSE VALIDATION (The "String Test") ---
    let activeMark = null;
    if (currentMiddle === "0.2" && currentCenter === "0.0") activeMark = 'mark1';
    else if (currentMiddle === "0.0" && currentCenter === "-0.6") activeMark = 'mark2';
    else if (currentMiddle === "-0.6" && currentCenter === "0.0") activeMark = 'mark3';

    if (activeMark && !boat.penalty.roundedMarks[activeMark]) {
        const isVerticallyAligned = Math.abs(boat.y - 250) < 50;
        
        if (isVerticallyAligned) {
            if (activeMark === 'mark1') {
                // MARK 1: Approached heading North (Upwind). 
                // To keep it to Port, boat must be on the RIGHT.
                if (boat.x > 320) {
                    boat.penalty.roundedMarks.mark1 = true;
                    console.log("✅ Mark 1 (Windward) rounded to PORT");
                }
            } else {
                // MARKS 2 & 3: Approached heading South (Away from North).
                // To keep them to Port, boat must be on the LEFT.
                if (boat.x < 280) {
                    boat.penalty.roundedMarks[activeMark] = true;
                    console.log(`✅ ${activeMark} rounded to PORT`);
                }
            }
        }
    }

    
    // --- 2A. START LINE DETECTION ---
    if (raceTimer.running && raceTimer.elapsed < 20) { 
        // Only check for crossing if we are in the 0.0, 0.0 sector
        if (currentMiddle === "0.0" && currentCenter === "0.0") {
            lineEl.style.display = "block";
        }
        else {
            lineEl.style.display = "none";
        }
    }

    // --- 2B. FINISH DETECTION ---
    if (raceTimer.running && raceTimer.elapsed > 20) { 
        if (currentMiddle === "0.0" && currentCenter === "0.0") {
            lineEl.style.display = "block";

            // Piercing detection (Crossing Y=250 moving Up)
            if (boat.y < 250 && boat.lastY >= 250) {
                if (boat.x > 100 && boat.x < 500) {
                    
                    const allMarksRounded = Object.values(boat.penalty.roundedMarks).every(v => v === true);

                    if (allMarksRounded) {
                        // SUCCESS CASE
                        handleRaceFinish(boat, raceTimer);
                    } else {
                        // DNF CASE (Simplified for v1)
                        console.log("❌ DNF: Course Incomplete");
                        alert("DNF (Did Not Finish)\n\nYou missed a mark or rounded incorrectly. Try again!");
                        location.reload(); // Quick reset for the player
                    }
                }
            }
        } else {
            lineEl.style.display = "none";
        }
    }
}

/**
 * Tally the final score, save to Firebase, and display results.
 */
async function handleRaceFinish(boat, raceTimer) {
    // 1. Stop the race clock immediately
    raceTimer.running = false; 
    const baseTime = raceTimer.elapsed;

    // 2. Calculate Penalties
    let penaltySeconds = 0;
    
    // Rule 29.1 (OCS): +30s
    if (boat.penalty.ocs) {
        penaltySeconds += 30;
    }

    // Rule 31 (Finish Mark Hit): +30s
    if (boat.penalty.marksHit.finishMark) {
        penaltySeconds += 30;
    }

    // Rule 31 (Rounding Mark Hits): +20% of base time per hit
    const roundingHits = Object.keys(boat.penalty.marksHit)
        .filter(key => key.startsWith('mark') && boat.penalty.marksHit[key]).length;
    
    const roundingPenalty = (baseTime * 0.20 * roundingHits);

    // 3. Final Total Time
    const totalTime = baseTime + penaltySeconds + roundingPenalty;

    // 4. Handle User Identity & Database
    const playerName = prompt(`🏁 FINISH!\nYour Time: ${totalTime.toFixed(2)}s\n\nEnter your name for the leaderboard:`, "Sailor");

    if (playerName) {
        try {
            // Save to Firebase
            await saveRaceResult(playerName, totalTime);
            
            // Fetch current Top 10
            const winners = await getTopTen();
            
            // Display Results (Placeholder for our next step: the Modal UI)
            displayLeaderboard(totalTime, winners);
        } catch (error) {
            console.error("Database error:", error);
            alert("Finish recorded locally, but couldn't reach the leaderboard.");
        }
    }
}

/**
 * UI logic to show the Top 10
 */
function displayLeaderboard(yourTime, winners) {
    const modal = document.getElementById('finishModal');
    const timeDisplay = document.getElementById('playerFinalTime');
    const tableBody = document.getElementById('leaderboardBody');

    // 1. Show the time
    timeDisplay.textContent = yourTime.toFixed(2);

    // 2. Clear and fill the table
    tableBody.innerHTML = "";
    winners.forEach((record, index) => {
        const row = `
            <tr>
                <td>${index + 1}</td>
                <td>${record.sailorName}</td>
                <td>${record.finalTime.toFixed(2)}s</td>
            </tr>`;
        tableBody.innerHTML += row;
    });

    // 3. Reveal the modal
    const shareBtn = document.getElementById('shareBtn');
    const shareData = {
        title: 'ILCA Sailing Simulator',
        text: `I just finished the Dun Laoghaire course in ${yourTime.toFixed(2)}s! Can you beat my time? ⛵`,
        url: window.location.href
    };

    shareBtn.onclick = async () => {
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback for browsers that don't support native share (like some desktop browsers)
                const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`;
                window.open(tweetUrl, '_blank');
            }
        } catch (err) {
            console.log('Error sharing:', err);
        }
    };

    modal.style.display = "flex";

}
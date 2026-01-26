/**
 * Showroom Shuffle Logic
 * randomizes the library while ensuring contrast (no more than 2 same-toned slabs adjacent)
 */
export function shuffleStones(stones: any[]) {
    // 1. Initial Shuffle
    let shuffled = [...stones].sort(() => Math.random() - 0.5);

    // 2. Enforce Contrast (Prevent > 2 identical tones in a row)
    for (let i = 2; i < shuffled.length; i++) {
        const t1 = shuffled[i - 2].tone;
        const t2 = shuffled[i - 1].tone;
        const t3 = shuffled[i].tone;

        if (t1 === t2 && t2 === t3) {
            // Find a swap candidate later in the list
            for (let j = i + 1; j < shuffled.length; j++) {
                if (shuffled[j].tone !== t1) {
                    // Swap
                    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                    break;
                }
            }
        }
    }
    return shuffled;
}

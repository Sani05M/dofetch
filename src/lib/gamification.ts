import { supabase } from "./supabase";

/**
 * Updates a student's upload streak and checks for badge eligibility.
 */
export async function updateStudentStreak(userId: string) {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("streak_data, badges")
      .eq("id", userId)
      .single();

    if (!profile) return;

    const now = new Date();
    const streakData = (profile.streak_data as any) || { current: 0, max: 0, last_upload: null };
    const badges = profile.badges || [];
    
    if (!streakData.last_upload) {
      streakData.current = 1;
      streakData.max = 1;
    } else {
      const lastUpload = new Date(streakData.last_upload);
      const diffInHours = (now.getTime() - lastUpload.getTime()) / (1000 * 60 * 60);

      if (diffInHours >= 20 && diffInHours < 48) {
        // Increment streak if uploaded on the next day (roughly 20-48h window)
        streakData.current += 1;
        if (streakData.current > streakData.max) streakData.max = streakData.current;
      } else if (diffInHours >= 48) {
        // Reset streak if more than 2 days passed
        streakData.current = 1;
      }
      // If < 20 hours, we don't increment yet (prevent spamming streaks in one day)
    }

    streakData.last_upload = now.toISOString();

    // Badge Logic: "The Consistency King" for 7 day streak
    if (streakData.current >= 7 && !badges.includes("Consistency_King")) {
      badges.push("Consistency_King");
    }

    await supabase
      .from("profiles")
      .update({ 
        streak_data: streakData,
        badges: badges
      })
      .eq("id", userId);

    return { streakData, newBadges: badges };
  } catch (error) {
    console.error("Gamification Error:", error);
    return null;
  }
}

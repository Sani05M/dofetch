import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateStudentStreak } from "../gamification";
import { supabase } from "../supabase";

const mockSingle = vi.fn();
const mockUpdateEq = vi.fn();

// Robust Supabase mock
vi.mock("../supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSingle,
        })),
      })),
      update: vi.fn(() => ({
        eq: mockUpdateEq,
      })),
    })),
  },
}));

describe("Gamification Engine", () => {
  const userId = "user_123";

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateEq.mockResolvedValue({});
  });

  it("initializes a new streak for a first-time uploader", async () => {
    const mockProfile = { streak_data: null, badges: [] };
    mockSingle.mockResolvedValueOnce({ data: mockProfile });

    const result = await updateStudentStreak(userId);

    expect(result?.streakData.current).toBe(1);
    expect(result?.streakData.max).toBe(1);
  });

  it("increments streak if uploaded 24 hours later", async () => {
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const mockProfile = {
      streak_data: { current: 3, max: 3, last_upload: yesterday.toISOString() },
      badges: [],
    };

    mockSingle.mockResolvedValueOnce({ data: mockProfile });

    const result = await updateStudentStreak(userId);

    expect(result?.streakData.current).toBe(4);
    expect(result?.streakData.max).toBe(4);
  });

  it("does not increment streak if uploaded again within 1 hour", async () => {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const mockProfile = {
      streak_data: {
        current: 3,
        max: 3,
        last_upload: oneHourAgo.toISOString(),
      },
      badges: [],
    };

    mockSingle.mockResolvedValueOnce({ data: mockProfile });

    const result = await updateStudentStreak(userId);

    expect(result?.streakData.current).toBe(3);
  });

  it("resets streak if more than 48 hours passed", async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setHours(threeDaysAgo.getHours() - 72);

    const mockProfile = {
      streak_data: {
        current: 5,
        max: 5,
        last_upload: threeDaysAgo.toISOString(),
      },
      badges: [],
    };

    mockSingle.mockResolvedValueOnce({ data: mockProfile });

    const result = await updateStudentStreak(userId);

    expect(result?.streakData.current).toBe(1);
  });

  it('awards "Consistency King" badge on 7th day', async () => {
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const mockProfile = {
      streak_data: { current: 6, max: 6, last_upload: yesterday.toISOString() },
      badges: [],
    };

    mockSingle.mockResolvedValueOnce({ data: mockProfile });

    const result = await updateStudentStreak(userId);

    expect(result?.newBadges).toContain("Consistency_King");
  });
});

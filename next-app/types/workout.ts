export type WorkoutExercise = {
  id: string;
  sessionId: string;
  exerciseName: string;
  sets?: number | null;
  reps?: number | null;
  weight?: number | null;
  duration?: number | null;
  distance?: number | null;
  notes?: string | null;
};

export type WorkoutSession = {
  id: string;
  userId: string;
  date: string;
  notes?: string | null;
  exercises: WorkoutExercise[];
};

export type ExerciseInput = {
  exerciseName: string;
  sets?: number | null;
  reps?: number | null;
  weight?: number | null;
  duration?: number | null;
  distance?: number | null;
  notes?: string | null;
};

export type WorkoutStats = {
  streak: number;
  thisWeekCount: number;
  thisMonthCount: number;
  activityDates: string[];
  exerciseHistory: Record<string, Array<{
    date: string;
    sets?: number | null;
    reps?: number | null;
    weight?: number | null;
    duration?: number | null;
    distance?: number | null;
  }>>;
};

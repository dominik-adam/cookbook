export type ExerciseType = 'SPRINTS' | 'PULLUPS' | 'DIPS';

export type DailyPlanSettings = {
  id: string;
  userId: string;
  waterTargetL: number;
  creatineTargetG: number;
  calorieTarget: number;
  sprintCount: number;
  sprintFrequencyDays: number;
  pullupWeightKg: number;
  pullupSets: number;
  pullupRepsPerSet: number;
  pullupFrequencyDays: number;
  dipWeightKg: number;
  dipSets: number;
  dipRepsPerSet: number;
  dipFrequencyDays: number;
  sprintStartDate: string | null;
  pullupStartDate: string | null;
  dipStartDate: string | null;
  updatedAt: string;
  createdAt: string;
};

export type CalorieEntry = {
  id: string;
  dailyLogId: string;
  amount: number;
  label: string | null;
  createdAt: string;
};

export type DailyLog = {
  id: string;
  userId: string;
  date: string;
  waterConsumedL: number;
  waterTargetL: number;
  creatineDone: boolean;
  creatineTargetG: number;
  calorieTarget: number;
  weightKg: number | null;
  calorieEntries: CalorieEntry[];
};

export type ExerciseLog = {
  id: string;
  scheduleId: string;
  exerciseType: ExerciseType;
  date: string;
  sprintsDone: number | null;
  sprintsPlanned: number | null;
  setResults: number[] | null;
  weightKgUsed: number | null;
  weightKgPlanned: number | null;
  setsPlanned: number | null;
  repsPerSetPlanned: number | null;
  notes: string | null;
  fullyCompleted: boolean;
  progressionApplied: string | null;
};

export type ExerciseSchedule = {
  id: string;
  userId: string;
  exerciseType: ExerciseType;
  scheduledDate: string;
  exerciseLog: ExerciseLog | null;
};

export type DayData = {
  dailyLog: DailyLog | null;
  exerciseSchedules: ExerciseSchedule[];
  settings: DailyPlanSettings | null;
};

export type CalendarExercise = {
  scheduleId: string;
  type: ExerciseType;
  logged: boolean;
  fullyCompleted: boolean;
  past: boolean;
  // Sprints
  sprintsDone: number | null;
  sprintsPlanned: number | null;
  // Strength
  setResults: number[] | null;
  weightKgUsed: number | null;
  // Planned values (from log snapshot if logged, from settings if not)
  setsPlanned: number | null;
  repsPerSetPlanned: number | null;
  weightKgPlanned: number | null;
};

export type DaySummary = {
  exercises: CalendarExercise[];
};

export type MonthData = {
  days: Record<string, DaySummary>;
};

export type ProgressionSuggestion = {
  exerciseType: ExerciseType;
  message: string;
} | null;

// Recharts data point types
export type WaterTrendPoint = { date: string; consumed: number; target: number };
export type CalorieTrendPoint = { date: string; consumed: number; target: number };
export type WeightPoint = { date: string; weightKg: number };
export type SprintPoint = { date: string; done: number; planned: number };
export type StrengthPoint = { date: string; totalReps: number; weightKg: number };

export type ExerciseCompletionRate = { scheduled: number; completed: number };

export type PlannerStats = {
  waterTrend: WaterTrendPoint[];
  calorieTrend: CalorieTrendPoint[];
  weightHistory: WeightPoint[];
  sprintHistory: SprintPoint[];
  strengthHistory: { PULLUPS: StrengthPoint[]; DIPS: StrengthPoint[] };
  exerciseCompletionRates: Record<ExerciseType, ExerciseCompletionRate>;
  summary: {
    daysWithWaterMet: number;
    daysWithCreatine: number;
    daysWithCaloriesMet: number;
    totalDaysLogged: number;
  };
};

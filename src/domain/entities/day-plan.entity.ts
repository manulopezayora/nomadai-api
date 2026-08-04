export interface DayPlan {
  id: string;
  tripId: string;
  dayNumber: number;
  date: Date;
  title: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

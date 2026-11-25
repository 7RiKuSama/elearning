export interface TeacherCourseStats {
  resourceCount: number;
  evalCount: number;
  studentCount: number;
  avgProgress: number;
}

export const CARD_THEMES = [
  {
    gradient: 'from-indigo-600 via-indigo-700 to-violet-800',
    barColor: 'bg-indigo-600',
  },
  {
    gradient: 'from-violet-600 via-purple-700 to-fuchsia-800',
    barColor: 'bg-violet-600',
  },
  {
    gradient: 'from-sky-600 via-blue-700 to-indigo-800',
    barColor: 'bg-sky-600',
  },
  {
    gradient: 'from-emerald-600 via-teal-700 to-cyan-800',
    barColor: 'bg-emerald-600',
  },
  {
    gradient: 'from-rose-600 via-pink-700 to-purple-800',
    barColor: 'bg-rose-600',
  },
];

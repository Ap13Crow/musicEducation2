export const SPACE_ID = "6k6op2goyvl9mhdv";
export const AGENT_ID = "01KXDA6ZBJVY41NNK419WW3J40";
export const PUBLIC_AGENT_ID = "01KXDA6ZCEQWBVB5YB3G0FNAD6";

export const PROJECTS = {
  students: "yCzPZwvjD6s124Yr",
  teachers: "XqBrvi6eTkrZPkQL",
  courses: "mz6xvBkYZCiQ5ASh",
  enrollments: "AQjMqkkXwhAH2cX8",
  bookings: "haf1nb5VT6sWLuBt",
  events: "Xw8uUjocwMyHWjhp",
  payments: "LK2Qh6EadjSeJ7VB",
  evaluations: "YB5Wt5tbeQw5a3bE",
  userProfiles: "Q5N5xFmrwjQtJ8AK",
  friendRequests: "oT3nXgc8Jf8d9UMT",
  eventAttendees: "duWFSi51oxhwTsL1",
  teacherAvailability: "hA5jeKe1uHJZ1bqa",
  courseModules: "JvcyXNxVya2hypCU",
  courseLessons: "mF787SepJLQRXCyK",
  courseMedia: "K7tCbkH1kvXs2axc",
  musicScores: "DXd1EuJ8awCBmp35",
  userScores: "QfqeEMtjSgqJFuv1",
} as const;

export const APP_NAME = "My Music Coach";

export type UserRole = "student" | "teacher" | "admin" | "moderator";

export interface UserProfile {
  nodeId: string;
  oidcSub: string;
  email: string;
  displayName: string;
  role: UserRole;
  linkedStudentId: string;
  linkedTeacherId: string;
  instrument: string;
  skillLevel: string;
}

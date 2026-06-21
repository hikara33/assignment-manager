export interface InviteEmailJob {
  type: 'invite';

  email: string;
  token: string;
}

export interface ReminderEmailJob {
  type: 'deadline-reminder';

  email: string;
  taskTitle: string;
  dueDay: string;
  assignmentId: string;
}

export type EmailJobData = InviteEmailJob | ReminderEmailJob;

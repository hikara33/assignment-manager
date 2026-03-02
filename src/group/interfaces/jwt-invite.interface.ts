export interface InvitePayload {
  email: string;
  groupId: string;
  invitedById: string;
  type: "GROUP_INVITE";
}
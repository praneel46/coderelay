export interface TeamMember {
  id: string;
  teamId: string;
  displayName: string;
  memberOrder: 1 | 2 | 3;
  isActive: boolean;
}

export interface Team {
  id: string;
  teamCode: string;
  name: string;
  members?: TeamMember[];
  isActive: boolean;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export interface Allocation {
  id: string;
  teamMemberId: string;
  projectId: string;
  startDate: string;
  endDate: string;
  percentage: number;
}

export interface Project {
  id: string;
  name: string;
  color: string;
}
export interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  salary: number;
  joinedDate: string;
  status: string;
}

export const EMPLOYEES_DATA: Employee[] = [
  { id: 'emp_01', name: 'Ruth Herlin', role: 'Lead Systems Architect', department: 'Engineering', salary: 125000, joinedDate: '2024-03-15', status: 'Active' },
  { id: 'emp_02', name: 'Kenji Sato', role: 'Senior Frontend Engineer', department: 'Engineering', salary: 98000, joinedDate: '2025-06-10', status: 'Active' },
  { id: 'emp_03', name: 'Amara Okafor', role: 'HR Coordinator', department: 'HR', salary: 58000, joinedDate: '2026-01-20', status: 'Active' },
  { id: 'emp_04', name: 'Liam Thompson', role: 'DevOps Specialist', department: 'Engineering', salary: 112000, joinedDate: '2025-09-01', status: 'Active' },
  { id: 'emp_05', name: 'Elena Rostova', role: 'Sales Manager', department: 'Sales', salary: 85000, joinedDate: '2024-11-15', status: 'Active' },
  { id: 'emp_06', name: 'Carlos Mendez', role: 'Financial Analyst', department: 'Finance', salary: 72000, joinedDate: '2026-05-04', status: 'Active' },
  { id: 'emp_07', name: 'Olivia Vance', role: 'Marketing Strategist', department: 'Marketing', salary: 65000, joinedDate: '2025-02-18', status: 'On Leave' },
  { id: 'emp_08', name: 'David Kim', role: 'Junior Developer', department: 'Engineering', salary: 48000, joinedDate: '2026-07-01', status: 'Active' },
  { id: 'emp_09', name: 'Sophie Dubois', role: 'Technical Writer', department: 'HR', salary: 52000, joinedDate: '2024-08-12', status: 'Inactive' },
  { id: 'emp_10', name: 'Rajesh Patel', role: 'Head of Marketing', department: 'Marketing', salary: 118000, joinedDate: '2023-12-05', status: 'Active' },
  { id: 'emp_11', name: 'Aiden Gallagher', role: 'Account Representative', department: 'Sales', salary: 45000, joinedDate: '2026-06-25', status: 'Active' },
  { id: 'emp_12', name: 'Zoe Jenkins', role: 'Senior Sales Associate', department: 'Sales', salary: 69000, joinedDate: '2025-04-14', status: 'Inactive' }
];

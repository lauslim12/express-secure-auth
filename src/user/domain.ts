/**
 * Representation of a user in this system.
 */
export type User = {
  id: string;
  username: string;
  password: string;
  salt: string;
  name: string;
  address: string;
  changedPasswordAfter: string;
  created: string;
  updated: string;
};

/**
 * Representation of a stripped user object.
 */
type UserResponse = Omit<User, 'password' | 'salt'>;

/**
 * All business logic of this 'User' entity.
 */
export interface Service {
  getUsers: () => Promise<UserResponse[]>;
  getUser: (id: string) => Promise<UserResponse | null>;
  getUserByUsername: (username: string) => Promise<UserResponse | null>;
  createUser: (user: User) => Promise<UserResponse>;
  modifyUser: (id: string, user: Partial<User>) => Promise<UserResponse>;
  removeUser: (id: string) => Promise<void>;
}

/**
 * All data access layer logic of this 'User' entity.
 */
export interface Repository {
  fetchUsers: () => Promise<User[]>;
  fetchUser: (id: string) => Promise<User | null>;
  fetchUserByUsername: (username: string) => Promise<User | null>;
  insertUser: (user: User) => Promise<User>;
  updateUser: (id: string, user: Partial<User>) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
}

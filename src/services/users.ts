import { eq } from 'drizzle-orm';
import { getDb, users, type User, type NewUser } from '@/db';
import { generateId, now } from '@/lib/utils';

export async function createUser(data: {
  email: string;
  name?: string;
  passwordHash?: string;
  image?: string;
}): Promise<User> {
  const db = getDb();
  const id = generateId();
  const timestamp = now();

  const user: NewUser = {
    id,
    email: data.email.toLowerCase(),
    name: data.name || null,
    passwordHash: data.passwordHash || null,
    image: data.image || null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.insert(users).values(user);
  return user as User;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const db = getDb();
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = getDb();
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return result[0];
}

export async function updateUser(id: string, data: Partial<Pick<User, 'name' | 'image' | 'emailVerified' | 'role'>>) {
  const db = getDb();
  await db
    .update(users)
    .set({ ...data, updatedAt: now() })
    .where(eq(users.id, id));
}

export async function updateUserRole(id: string, role: 'renter' | 'landlord' | 'manager' | 'maintenance') {
  const db = getDb();
  await db
    .update(users)
    .set({ role, updatedAt: now() })
    .where(eq(users.id, id));
}

export async function deleteUser(id: string) {
  const db = getDb();
  await db.delete(users).where(eq(users.id, id));
}

export async function getOrCreateUser(data: {
  email: string;
  name?: string;
  image?: string;
}): Promise<User> {
  const existing = await getUserByEmail(data.email);
  if (existing) {
    // Update name and image if provided
    if (data.name || data.image) {
      await updateUser(existing.id, {
        name: data.name || existing.name,
        image: data.image || existing.image,
      });
    }
    return { ...existing, name: data.name || existing.name, image: data.image || existing.image };
  }
  return createUser(data);
}

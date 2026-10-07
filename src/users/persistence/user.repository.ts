import {
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User, UserRole } from '../../database/entities/user.entity';

@Injectable()
export class UsersRepository {
  private readonly users: Repository<User>;

  constructor(private readonly dataSource: DataSource) {
    this.users = dataSource.getRepository(User);
  }

  findAllUsers(): Promise<User[]> {
    return this.users.find({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      order: { createdAt: 'ASC' },
    });
  }

  findUserById(id: string): Promise<User | null> {
    return this.users.findOne({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  findByEmailOrUsername(email: string, username: string): Promise<User | null> {
    return this.users
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .orWhere('user.username = :username', { username })
      .getOne();
  }

  createUser(input: {
    email: string;
    username: string;
    passwordHash: string;
  }): Promise<User> {
    return this.users.save(
      this.users.create({ ...input, role: UserRole.LEARNER }),
    );
  }

  updateRole(
    adminUserId: string,
    userId: string,
    role: UserRole,
  ): Promise<User | null> {
    return this.dataSource.transaction('READ COMMITTED', async (manager) => {
      // All API role changes share this lock, including promotions.
      // Acquire it before reading so concurrent demotions see committed roles.
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
        'hpc-learning-hub:user-role-changes',
      ]);
      const users = manager.getRepository(User);
      const admin = await users.findOne({
        where: { id: adminUserId, role: UserRole.ADMIN },
        select: { id: true },
      });
      if (!admin) throw new ForbiddenException('Administrator access required');
      const user = await users.findOne({
        where: { id: userId },
        select: { id: true, email: true, username: true, role: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user) return null;
      if (user.role === role) return user;
      if (
        user.role === UserRole.ADMIN &&
        role !== UserRole.ADMIN &&
        (await users.countBy({ role: UserRole.ADMIN })) <= 1
      ) {
        throw new ConflictException('Cannot demote the final administrator');
      }
      await users.update({ id: userId }, { role });
      user.role = role;
      return user;
    });
  }
}

import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User, UserRole } from '../../database/entities/user.entity';

@Injectable()
export class UsersRepository {
  private readonly users: Repository<User>;

  constructor(dataSource: DataSource) {
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
}

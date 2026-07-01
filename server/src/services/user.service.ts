import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { Role } from '@prisma/client';

interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: Role;
  isActive?: boolean;
}

export class UserService {
  async list(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          cpf: true,
          email: true,
          role: true,
          isActive: true,
          twoFactorEnabled: true,
          lastLogin: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.user.count(),
    ]);

    return { users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        cpf: true,
        email: true,
        role: true,
        isActive: true,
        twoFactorEnabled: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new Error('Usuário não encontrado');
    return user;
  }

  async update(id: string, data: UpdateUserInput) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('Usuário não encontrado');

    if (data.email && data.email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing) throw new Error('E-mail já em uso');
    }

    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Usuário não encontrado');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new Error('Senha atual incorreta');

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return { message: 'Senha alterada com sucesso' };
  }

  async deactivate(id: string) {
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
    return { message: 'Usuário desativado' };
  }
}

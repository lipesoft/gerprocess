import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { generateToken } from '../utils/crypto';
import { sendEmail, resetPasswordTemplate } from '../utils/email';
import { AuthPayload } from '../middlewares/auth';
import { Role } from '@prisma/client';

interface LoginInput {
  login: string; // email ou CPF
  password: string;
  totpCode?: string;
}

interface RegisterInput {
  name: string;
  cpf: string;
  email: string;
  password: string;
  role?: Role;
}

export class AuthService {
  async register(data: RegisterInput) {
    const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingEmail) {
      throw new Error('E-mail já cadastrado');
    }

    const existingCpf = await prisma.user.findUnique({ where: { cpf: data.cpf } });
    if (existingCpf) {
      throw new Error('CPF já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        cpf: data.cpf.replace(/\D/g, ''),
        email: data.email.toLowerCase(),
        password: hashedPassword,
        role: data.role || Role.ENGENHEIRO,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(data: LoginInput) {
    const { login, password, totpCode } = data;

    // Busca por email ou CPF
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: login.toLowerCase() },
          { cpf: login.replace(/\D/g, '') },
        ],
      },
    });

    if (!user || !user.isActive) {
      throw new Error('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Credenciais inválidas');
    }

    // Verifica 2FA se habilitado
    if (user.twoFactorEnabled) {
      if (!totpCode) {
        return { requiresTwoFactor: true, userId: user.id };
      }

      const isValid = authenticator.verify({
        token: totpCode,
        secret: user.twoFactorSecret!,
      });

      if (!isValid) {
        throw new Error('Código 2FA inválido');
      }
    }

    // Atualiza último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Gera tokens
    const tokens = this.generateTokens({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
      },
      ...tokens,
    };
  }

  async setup2FA(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Usuário não encontrado');

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, env.TOTP_ISSUER, secret);
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    // Salva o secret temporariamente (será confirmado após verificação)
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    return { secret, qrCodeUrl };
  }

  async verify2FA(userId: string, code: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) throw new Error('2FA não configurado');

    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new Error('Código inválido');
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    return { message: '2FA ativado com sucesso' };
  }

  async disable2FA(userId: string, password: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Usuário não encontrado');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new Error('Senha incorreta');

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });

    return { message: '2FA desativado com sucesso' };
  }

  async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      // Não revela se o e-mail existe ou não (segurança)
      return { message: 'Se o e-mail existir, você receberá um link de recuperação.' };
    }

    const resetToken = generateToken();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const html = resetPasswordTemplate(user.name, resetUrl);

    await sendEmail({
      to: user.email,
      subject: 'Gerprocess - Recuperação de Senha',
      html,
    });

    return { message: 'Se o e-mail existir, você receberá um link de recuperação.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new Error('Token inválido ou expirado');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { message: 'Senha alterada com sucesso' };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as AuthPayload;

      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user || !user.isActive) {
        throw new Error('Usuário inativo');
      }

      return this.generateTokens({
        userId: user.id,
        role: user.role,
        email: user.email,
      });
    } catch {
      throw new Error('Refresh token inválido');
    }
  }

  private generateTokens(payload: AuthPayload) {
    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
    });

    return { accessToken, refreshToken };
  }
}

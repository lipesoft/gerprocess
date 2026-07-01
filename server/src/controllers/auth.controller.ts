import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { auditLog } from '../middlewares/audit';
import { env } from '../config/env';

const authService = new AuthService();

const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cpf: z.string().min(11, 'CPF inválido').max(14),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial'),
});

const loginSchema = z.object({
  login: z.string().min(1, 'Login é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
  totpCode: z.string().optional(),
});

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const data = registerSchema.parse(req.body);
      const user = await authService.register(data);
      res.status(201).json({ message: 'Usuário cadastrado com sucesso', user });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data);

      if ('requiresTwoFactor' in result) {
        return res.status(200).json({ requiresTwoFactor: true });
      }

      // Set cookies
      res.cookie('accessToken', result.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000, // 15 min
      });

      res.cookie('refreshToken', result.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
        path: '/api/auth/refresh',
      });

      await auditLog(result.user.id, 'LOGIN', 'user', result.user.id, undefined, req);

      res.json({ user: result.user });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      res.status(401).json({ error: error.message });
    }
  }

  async logout(req: Request, res: Response) {
    if (req.user) {
      await auditLog(req.user.userId, 'LOGOUT', 'user', req.user.userId, undefined, req);
    }

    res.clearCookie('accessToken', COOKIE_OPTIONS);
    res.clearCookie('refreshToken', { ...COOKIE_OPTIONS, path: '/api/auth/refresh' });
    res.json({ message: 'Logout realizado com sucesso' });
  }

  async refresh(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token não encontrado' });
      }

      const tokens = await authService.refreshToken(refreshToken);

      res.cookie('accessToken', tokens.accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refreshToken', tokens.refreshToken, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/auth/refresh',
      });

      res.json({ message: 'Token renovado' });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  }

  async me(req: Request, res: Response) {
    try {
      const user = await new (await import('../services/user.service')).UserService().findById(req.user!.userId);
      res.json({ user });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async setup2FA(req: Request, res: Response) {
    try {
      const result = await authService.setup2FA(req.user!.userId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async verify2FA(req: Request, res: Response) {
    try {
      const { code } = z.object({ code: z.string().length(6) }).parse(req.body);
      const result = await authService.verify2FA(req.user!.userId, code);
      await auditLog(req.user!.userId, '2FA_ENABLED', 'user', req.user!.userId, undefined, req);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async disable2FA(req: Request, res: Response) {
    try {
      const { password } = z.object({ password: z.string() }).parse(req.body);
      const result = await authService.disable2FA(req.user!.userId, password);
      await auditLog(req.user!.userId, '2FA_DISABLED', 'user', req.user!.userId, undefined, req);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async requestPasswordReset(req: Request, res: Response) {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);
      const result = await authService.requestPasswordReset(email);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, password } = z.object({
        token: z.string(),
        password: z.string().min(8),
      }).parse(req.body);
      const result = await authService.resetPassword(token, password);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

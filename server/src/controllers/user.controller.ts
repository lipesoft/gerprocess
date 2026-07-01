import { Request, Response } from 'express';
import { z } from 'zod';
import { UserService } from '../services/user.service';
import { auditLog } from '../middlewares/audit';
import { Role } from '@prisma/client';

const userService = new UserService();

const updateSchema = z.object({
  name: z.string().min(3).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
});

export class UserController {
  async list(req: Request, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const result = await userService.list(page, limit);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const user = await userService.findById(req.params.id);
      res.json(user);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = updateSchema.parse(req.body);
      const user = await userService.update(req.params.id, data);
      await auditLog(req.user!.userId, 'UPDATE', 'user', req.params.id, JSON.stringify(data), req);
      res.json(user);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async changePassword(req: Request, res: Response) {
    try {
      const { currentPassword, newPassword } = z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8),
      }).parse(req.body);

      const result = await userService.changePassword(req.user!.userId, currentPassword, newPassword);
      await auditLog(req.user!.userId, 'CHANGE_PASSWORD', 'user', req.user!.userId, undefined, req);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async deactivate(req: Request, res: Response) {
    try {
      const result = await userService.deactivate(req.params.id);
      await auditLog(req.user!.userId, 'DEACTIVATE', 'user', req.params.id, undefined, req);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

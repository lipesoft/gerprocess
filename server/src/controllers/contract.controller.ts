import { Request, Response } from 'express';
import { z } from 'zod';
import { ContractService } from '../services/contract.service';
import { auditLog } from '../middlewares/audit';
import { ContractStatus } from '@prisma/client';

const contractService = new ContractService();

const createSchema = z.object({
  name: z.string().min(3),
  contractNumber: z.string().min(1),
  company: z.string().min(2),
  workType: z.string().min(2),
  objective: z.string().optional(),
  totalValue: z.number().positive(),
  startDate: z.string().transform((s) => new Date(s)),
  endDate: z.string().transform((s) => new Date(s)),
  responsibleId: z.string().uuid(),
});

const updateSchema = z.object({
  name: z.string().min(3).optional(),
  company: z.string().min(2).optional(),
  workType: z.string().min(2).optional(),
  objective: z.string().optional(),
  totalValue: z.number().positive().optional(),
  startDate: z.string().transform((s) => new Date(s)).optional(),
  endDate: z.string().transform((s) => new Date(s)).optional(),
  status: z.nativeEnum(ContractStatus).optional(),
  responsibleId: z.string().uuid().optional(),
});

const commentSchema = z.object({
  content: z.string().min(2).max(2000),
});

export class ContractController {
  async create(req: Request, res: Response) {
    try {
      const data = createSchema.parse(req.body);
      const contract = await contractService.create({
        ...data,
        createdById: req.user!.userId,
      });

      await auditLog(req.user!.userId, 'CREATE', 'contract', contract.id, `Contrato "${data.name}" criado`, req);
      res.status(201).json(contract);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const contract = await contractService.findById(req.params.id);
      res.json(contract);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  }

  async addComment(req: Request, res: Response) {
    try {
      const { content } = commentSchema.parse(req.body);
      const comment = await contractService.addComment(req.params.id, req.user!.userId, content);

      await auditLog(req.user!.userId, 'COMMENT', 'contract', req.params.id, content, req);
      res.status(201).json(comment);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const filters = {
        status: req.query.status as ContractStatus | undefined,
        search: req.query.search as string | undefined,
        responsibleId: req.query.responsibleId as string | undefined,
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 20,
      };

      const result = await contractService.list(filters);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = updateSchema.parse(req.body);
      const contract = await contractService.update(req.params.id, data, req.user!.userId);

      await auditLog(req.user!.userId, 'UPDATE', 'contract', contract.id, JSON.stringify(data), req);
      res.json(contract);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await contractService.delete(req.params.id);
      await auditLog(req.user!.userId, 'DELETE', 'contract', req.params.id, undefined, req);
      res.json({ message: 'Contrato removido' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async dashboard(req: Request, res: Response) {
    try {
      const kpis = await contractService.getDashboardKPIs();
      res.json(kpis);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async calendar(req: Request, res: Response) {
    try {
      const month = Number(req.query.month) || new Date().getMonth() + 1;
      const year = Number(req.query.year) || new Date().getFullYear();
      const events = await contractService.getCalendarEvents(month, year);
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

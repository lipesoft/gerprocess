import { Request, Response } from 'express';
import { z } from 'zod';
import { PaymentService } from '../services/payment.service';
import { auditLog } from '../middlewares/audit';
import { PaymentStatus } from '@prisma/client';

const paymentService = new PaymentService();

const createSchema = z.object({
  contractId: z.string().uuid(),
  description: z.string().min(3),
  value: z.number().positive(),
  dueDate: z.string().transform((s) => new Date(s)),
  invoiceNumber: z.string().optional(),
  notes: z.string().optional(),
});

const updateSchema = z.object({
  description: z.string().min(3).optional(),
  value: z.number().positive().optional(),
  dueDate: z.string().transform((s) => new Date(s)).optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  paidDate: z.string().transform((s) => new Date(s)).optional(),
  invoiceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export class PaymentController {
  async create(req: Request, res: Response) {
    try {
      const data = createSchema.parse(req.body);
      const payment = await paymentService.create(data);
      await auditLog(req.user!.userId, 'CREATE', 'payment', payment.id, `Pagamento "${data.description}"`, req);
      res.status(201).json(payment);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async listByContract(req: Request, res: Response) {
    try {
      const payments = await paymentService.findByContract(req.params.contractId);
      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const data = updateSchema.parse(req.body);
      const payment = await paymentService.update(req.params.id, data);
      await auditLog(req.user!.userId, 'UPDATE', 'payment', payment.id, JSON.stringify(data), req);
      res.json(payment);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await paymentService.delete(req.params.id);
      await auditLog(req.user!.userId, 'DELETE', 'payment', req.params.id, undefined, req);
      res.json({ message: 'Pagamento removido' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

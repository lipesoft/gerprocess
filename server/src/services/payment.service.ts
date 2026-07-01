import { prisma } from '../config/database';
import { PaymentStatus, Prisma } from '@prisma/client';

interface CreatePaymentInput {
  contractId: string;
  description: string;
  value: number;
  dueDate: Date;
  invoiceNumber?: string;
  notes?: string;
}

interface UpdatePaymentInput {
  description?: string;
  value?: number;
  dueDate?: Date;
  status?: PaymentStatus;
  paidDate?: Date;
  invoiceNumber?: string;
  notes?: string;
}

export class PaymentService {
  async create(data: CreatePaymentInput) {
    const contract = await prisma.contract.findUnique({ where: { id: data.contractId } });
    if (!contract) throw new Error('Contrato não encontrado');

    const payment = await prisma.payment.create({
      data: {
        ...data,
        value: new Prisma.Decimal(data.value),
      },
    });

    return payment;
  }

  async findByContract(contractId: string) {
    return prisma.payment.findMany({
      where: { contractId },
      orderBy: { dueDate: 'asc' },
    });
  }

  async update(id: string, data: UpdatePaymentInput) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { contract: true },
    });
    if (!payment) throw new Error('Pagamento não encontrado');

    const updateData: any = { ...data };
    if (data.value !== undefined) {
      updateData.value = new Prisma.Decimal(data.value);
    }

    // Se marcou como pago, atualiza saldo do contrato
    if (data.status === PaymentStatus.PAGO && payment.status !== PaymentStatus.PAGO) {
      updateData.paidDate = data.paidDate || new Date();

      const newBalance = payment.contract.currentBalance.toNumber() - payment.value.toNumber();
      await prisma.contract.update({
        where: { id: payment.contractId },
        data: { currentBalance: new Prisma.Decimal(Math.max(0, newBalance)) },
      });
    }

    return prisma.payment.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    await prisma.payment.delete({ where: { id } });
    return { message: 'Pagamento removido' };
  }
}

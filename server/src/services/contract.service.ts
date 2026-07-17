import { prisma } from '../config/database';
import { ContractStatus, Prisma } from '@prisma/client';

interface CreateContractInput {
  name: string;
  contractNumber: string;
  company: string;
  workType: string;
  objective?: string;
  totalValue: number;
  startDate: Date;
  endDate: Date;
  responsibleId: string;
  createdById: string;
}

interface UpdateContractInput {
  name?: string;
  company?: string;
  workType?: string;
  objective?: string;
  totalValue?: number;
  startDate?: Date;
  endDate?: Date;
  status?: ContractStatus;
  responsibleId?: string;
}

interface ListContractsFilter {
  status?: ContractStatus;
  search?: string;
  responsibleId?: string;
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;
  page?: number;
  limit?: number;
}

export class ContractService {
  async create(data: CreateContractInput) {
    const contract = await prisma.contract.create({
      data: {
        ...data,
        totalValue: new Prisma.Decimal(data.totalValue),
        currentBalance: new Prisma.Decimal(data.totalValue),
        status: ContractStatus.PENDENTE,
      },
      include: {
        responsible: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return contract;
  }

  async findById(id: string) {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        responsible: { select: { id: true, name: true, email: true, role: true } },
        createdBy: { select: { id: true, name: true } },
        documents: true,
        payments: { orderBy: { dueDate: 'asc' } },
        comments: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        history: { orderBy: { changedAt: 'desc' }, take: 50 },
      },
    });

    if (!contract) throw new Error('Contrato não encontrado');
    return contract;
  }

  async addComment(contractId: string, userId: string, content: string) {
    const contract = await prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) throw new Error('Contrato não encontrado');

    return prisma.comment.create({
      data: {
        contractId,
        userId,
        content,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }

  async list(filters: ListContractsFilter) {
    const { status, search, responsibleId, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.ContractWhereInput = {};

    if (status) where.status = status;
    if (responsibleId) where.responsibleId = responsibleId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contractNumber: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (filters.endDateFrom || filters.endDateTo) {
      where.endDate = {};
      if (filters.endDateFrom) where.endDate.gte = filters.endDateFrom;
      if (filters.endDateTo) where.endDate.lte = filters.endDateTo;
    }

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        include: {
          responsible: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.contract.count({ where }),
    ]);

    return {
      contracts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(id: string, data: UpdateContractInput, userId: string) {
    const existing = await prisma.contract.findUnique({ where: { id } });
    if (!existing) throw new Error('Contrato não encontrado');

    // Registra histórico de alterações
    const historyEntries: any[] = [];
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && (existing as any)[key] !== value) {
        historyEntries.push({
          contractId: id,
          field: key,
          oldValue: String((existing as any)[key] || ''),
          newValue: String(value),
          changedBy: userId,
        });
      }
    }

    if (historyEntries.length > 0) {
      await prisma.contractHistory.createMany({ data: historyEntries });
    }

    const updateData: any = { ...data };
    if (data.totalValue !== undefined) {
      updateData.totalValue = new Prisma.Decimal(data.totalValue);
    }

    const contract = await prisma.contract.update({
      where: { id },
      data: updateData,
      include: {
        responsible: { select: { id: true, name: true, email: true } },
      },
    });

    return contract;
  }

  async delete(id: string) {
    await prisma.contract.delete({ where: { id } });
    return { message: 'Contrato removido com sucesso' };
  }

  async getDashboardKPIs() {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      totalActive,
      nearExpiry,
      newContracts,
      pendingRenewals,
      statusCounts,
      totalValue,
    ] = await Promise.all([
      prisma.contract.count({ where: { status: ContractStatus.EM_ANDAMENTO } }),
      prisma.contract.count({
        where: {
          status: ContractStatus.EM_ANDAMENTO,
          endDate: { lte: thirtyDaysFromNow, gte: now },
        },
      }),
      prisma.contract.count({
        where: { createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
      }),
      prisma.contract.count({
        where: { status: ContractStatus.PENDENTE },
      }),
      prisma.contract.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.contract.aggregate({
        where: { status: { in: [ContractStatus.EM_ANDAMENTO, ContractStatus.PENDENTE] } },
        _sum: { totalValue: true, currentBalance: true },
      }),
    ]);

    return {
      totalActive,
      nearExpiry,
      newContracts,
      pendingRenewals,
      statusCounts: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {} as Record<string, number>),
      totalValue: totalValue._sum.totalValue || 0,
      totalBalance: totalValue._sum.currentBalance || 0,
    };
  }

  async getCalendarEvents(month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const contracts = await prisma.contract.findMany({
      where: {
        endDate: { gte: startDate, lte: endDate },
      },
      select: { id: true, name: true, endDate: true, status: true },
    });

    const payments = await prisma.payment.findMany({
      where: {
        dueDate: { gte: startDate, lte: endDate },
      },
      select: { id: true, description: true, dueDate: true, status: true, contractId: true },
    });

    return { contracts, payments };
  }
}

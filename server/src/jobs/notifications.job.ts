import cron from 'node-cron';
import { prisma } from '../config/database';
import { ContractStatus, PaymentStatus } from '@prisma/client';
import { sendEmail, notificationTemplate } from '../utils/email';

/**
 * Job que roda diariamente às 8h para verificar:
 * - Contratos próximos do vencimento (7 dias)
 * - Pagamentos atrasados
 * - Pagamentos próximos do vencimento (3 dias)
 */
export function startNotificationJobs() {
  // Roda todo dia às 8h
  cron.schedule('0 8 * * *', async () => {
    console.log('🔔 Executando job de notificações...');

    try {
      await checkExpiringContracts();
      await checkOverduePayments();
      await checkUpcomingPayments();
    } catch (error) {
      console.error('Erro no job de notificações:', error);
    }
  });

  console.log('📅 Jobs de notificação agendados');
}

async function checkExpiringContracts() {
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const contracts = await prisma.contract.findMany({
    where: {
      status: ContractStatus.EM_ANDAMENTO,
      endDate: {
        lte: sevenDaysFromNow,
        gte: new Date(),
      },
    },
    include: {
      responsible: true,
    },
  });

  for (const contract of contracts) {
    const daysLeft = Math.ceil(
      (contract.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    await prisma.notification.create({
      data: {
        userId: contract.responsible.id,
        title: 'Contrato próximo do vencimento',
        message: `O contrato "${contract.name}" vence em ${daysLeft} dia(s).`,
        type: 'CONTRACT_EXPIRY',
      },
    });

    if (contract.responsible.email) {
      await sendEmail({
        to: contract.responsible.email,
        subject: `Gerprocess - Contrato "${contract.name}" vence em ${daysLeft} dia(s)`,
        html: notificationTemplate(
          contract.responsible.name,
          'Contrato próximo do vencimento',
          `O contrato "${contract.name}" (${contract.contractNumber}) vence em ${daysLeft} dia(s). Verifique a necessidade de renovação.`
        ),
      }).catch(console.error);
    }
  }
}

async function checkOverduePayments() {
  const overduePayments = await prisma.payment.findMany({
    where: {
      status: PaymentStatus.PENDENTE,
      dueDate: { lt: new Date() },
    },
    include: {
      contract: { include: { responsible: true } },
    },
  });

  for (const payment of overduePayments) {
    // Atualiza status para ATRASADO
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.ATRASADO },
    });

    await prisma.notification.create({
      data: {
        userId: payment.contract.responsible.id,
        title: 'Pagamento atrasado',
        message: `O pagamento "${payment.description}" do contrato "${payment.contract.name}" está atrasado.`,
        type: 'PAYMENT_OVERDUE',
      },
    });
  }
}

async function checkUpcomingPayments() {
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const upcomingPayments = await prisma.payment.findMany({
    where: {
      status: PaymentStatus.PENDENTE,
      dueDate: {
        lte: threeDaysFromNow,
        gte: new Date(),
      },
    },
    include: {
      contract: { include: { responsible: true } },
    },
  });

  for (const payment of upcomingPayments) {
    await prisma.notification.create({
      data: {
        userId: payment.contract.responsible.id,
        title: 'Pagamento próximo do vencimento',
        message: `O pagamento "${payment.description}" vence em breve.`,
        type: 'PAYMENT_DUE_SOON',
      },
    });
  }
}

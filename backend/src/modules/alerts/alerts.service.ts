import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AlertsService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    void this.refresh();
    this.timer = setInterval(() => void this.refresh(), 24 * 60 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async findAll(role: string, employeeId?: string) {
    return this.prisma.alertQueue.findMany({
      where: {
        OR: [
          { recipientRole: role },
          ...(employeeId ? [{ employeeId }] : []),
        ],
      },
      include: { employee: { select: { id: true, name: true, code: true } } },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async markRead(id: string) {
    return this.prisma.alertQueue.update({ where: { id }, data: { sentAt: new Date() } });
  }

  async refresh() {
    const thresholdSetting = await this.prisma.systemSetting.findUnique({ where: { key: 'alert_lead_days' } });
    const thresholds = (thresholdSetting?.value ?? '')
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value) && value >= 0);
    if (!thresholds.length) return { created: 0 };

    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const appointments = await this.prisma.appointment.findMany({
      where: { status: 'ACTIVE', endDate: { gte: now } },
      select: { employeeId: true, endDate: true },
    });

    const alerts = appointments.flatMap((appointment) => thresholds
      .filter((daysBefore) => {
        const alertDate = new Date(appointment.endDate);
        alertDate.setDate(alertDate.getDate() - daysBefore);
        return alertDate >= now && alertDate < endOfToday;
      })
      .map((daysBefore) => ({
        alertType: 'APPOINTMENT_EXPIRY' as const,
        employeeId: appointment.employeeId,
        dueDate: appointment.endDate,
        daysBefore,
        recipientRole: 'ESTABLISHMENT_OFFICER',
      })));

    if (!alerts.length) return { created: 0 };
    const result = await this.prisma.alertQueue.createMany({ data: alerts, skipDuplicates: true });
    return { created: result.count };
  }
}

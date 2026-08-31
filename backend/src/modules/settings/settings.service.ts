import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });
  }

  async findOne(key: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });
    if (!setting) {
      throw new NotFoundException(`Setting with key "${key}" not found`);
    }
    return setting;
  }

  async update(key: string, value: string) {
    await this.findOne(key);
    return this.prisma.systemSetting.update({
      where: { key },
      data: { value },
    });
  }

  async updateMany(settings: Array<{ key: string; value: string }>) {
    const uniqueSettings = Array.from(
      new Map(settings.map((setting) => [setting.key, setting.value])).entries(),
    ).map(([key, value]) => ({ key, value }));

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.systemSetting.findMany({
        where: { key: { in: uniqueSettings.map((setting) => setting.key) } },
        select: { key: true },
      });
      const existingKeys = new Set(existing.map((setting) => setting.key));
      const missingKeys = uniqueSettings
        .filter((setting) => !existingKeys.has(setting.key))
        .map((setting) => setting.key);
      if (missingKeys.length) {
        throw new NotFoundException(`Settings not found: ${missingKeys.join(', ')}`);
      }

      await Promise.all(uniqueSettings.map((setting) => tx.systemSetting.update({
        where: { key: setting.key },
        data: { value: setting.value },
      })));
      return tx.systemSetting.findMany({ orderBy: { key: 'asc' } });
    });
  }
}

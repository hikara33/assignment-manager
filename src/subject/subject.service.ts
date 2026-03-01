import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSubjectRequest } from './dto/create-subject.dto';
import { UpdateSubjectRequest } from './dto/update-subject.dto';

@Injectable()
export class SubjectService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dto: CreateSubjectRequest) {
    const { name, description } = dto;

    const existSubject = await this.prismaService.subject.findUnique({
      where: {
        name,
      },
    });

    if (existSubject) throw new ConflictException("Предмет с таким названием уже существует");

    return await this.prismaService.subject.create({
      data: {
        name,
        description,
      }
    });
  }

  async getOne(id: string) {
    return await this.prismaService.subject.findUnique({
      where: {
        id,
      },
    });
  }

  async getAll() {
    return await this.prismaService.subject.findMany();
  }

  async put(id: string, dto: UpdateSubjectRequest) {
    const { name, description } = dto;
    return await this.prismaService.subject.update({
      where: {
        id,
      },
      data: {
        name,
        description,
      },
    });
  }

  async remove(id: string): Promise<boolean> {
    await this.prismaService.subject.delete({
      where: {
        id,
      },
    });
    return true;
  }
}
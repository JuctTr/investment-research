import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { CreateContentDto } from './dto/create-content.dto'
import { UpdateContentDto } from './dto/update-content.dto'

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createContentDto: CreateContentDto, userId?: string) {
    // 如果没有提供用户ID，创建一个默认用户
    let targetUserId = userId

    if (!targetUserId) {
      // 查找或创建默认用户
      let defaultUser = await this.prisma.user.findFirst({
        where: { email: 'demo@example.com' },
      })

      if (!defaultUser) {
        defaultUser = await this.prisma.user.create({
          data: {
            email: 'demo@example.com',
            name: 'Demo User',
          },
        })
      }

      targetUserId = defaultUser.id
    }

    const content = await this.prisma.content.create({
      data: {
        ...createContentDto,
        userId: targetUserId,
      },
    })
    return content
  }

  async findAll(params: {
    page?: number
    limit?: number
    contentType?: string
    tags?: string[]
  }) {
    const { page = 1, limit = 10, contentType, tags } = params
    const skip = (page - 1) * limit

    const where: any = {}
    if (contentType) {
      where.contentType = contentType
    }
    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      }
    }

    const [contents, total] = await Promise.all([
      this.prisma.content.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.content.count({ where }),
    ])

    return {
      data: contents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async findOne(id: string) {
    const content = await this.prisma.content.findUnique({
      where: { id },
    })

    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`)
    }

    return content
  }

  async update(id: string, updateContentDto: UpdateContentDto) {
    const existingContent = await this.findOne(id)

    const updatedContent = await this.prisma.content.update({
      where: { id },
      data: updateContentDto,
    })

    return updatedContent
  }

  async remove(id: string) {
    const existingContent = await this.findOne(id)

    await this.prisma.content.delete({
      where: { id },
    })

    return { message: 'Content deleted successfully' }
  }
}
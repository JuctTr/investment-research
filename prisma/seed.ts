import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 创建默认用户
  const defaultUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
    },
  })

  console.log('Default user created:', defaultUser)

  // 创建示例内容
  const sampleContent = await prisma.content.create({
    data: {
      title: '2025年新能源行业投资分析报告',
      description: '深度分析新能源行业的投资机会和风险',
      contentType: 'REPORT',
      tags: ['新能源', '投资分析', '2025年趋势'],
      userId: defaultUser.id,
    },
  })

  console.log('Sample content created:', sampleContent)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
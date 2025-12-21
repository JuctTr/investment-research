export default function Home() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1>投研分析系统</h1>
        <p style={{ fontSize: '18px', color: '#666' }}>
          个人投研分析系统 - 观点 → 决策 → 复盘
        </p>
      </div>

      <div style={{ textAlign: 'center', marginTop: '48px' }}>
        <p>访问 <a href="/content">内容管理</a> 开始使用</p>
      </div>
    </div>
  )
}
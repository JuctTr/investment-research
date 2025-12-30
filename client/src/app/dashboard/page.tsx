import type { FC } from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import {
  FileTextOutlined,
  BulbOutlined,
  FundOutlined,
  HistoryOutlined,
} from '@ant-design/icons';

/**
 * 仪表盘首页
 */
const DashboardPage: FC = () => {
  return (
    <div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="内容总数"
              value={0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="观点总数"
              value={0}
              prefix={<BulbOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="决策总数"
              value={0}
              prefix={<FundOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="复盘总数"
              value={0}
              prefix={<HistoryOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 16 }} title="最近动态">
        <p>暂无动态</p>
      </Card>
    </div>
  );
};

export default DashboardPage;

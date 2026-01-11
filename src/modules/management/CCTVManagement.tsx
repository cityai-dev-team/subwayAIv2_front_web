import { useEffect, useState, useCallback } from 'react';
import { Card, Typography, Spin, Table, Select, Button, Space, Modal, Form, Input, message } from 'antd';
import { DownloadOutlined, EditOutlined } from '@ant-design/icons';
import { api } from '../../lib/api';

const { Title, Text } = Typography;

interface CCTVData {
  key: string;
  uid: number;
  cctv_id: string;
  cctv_name: string;
  region_id: string;
  region_name: string;
  last_update_time?: string;
  status?: string;
}

export default function CCTVManagement() {
  const [loading, setLoading] = useState(false);
  const [cctvList, setCctvList] = useState<CCTVData[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [regions, setRegions] = useState<Array<{ region_id: string; region_name: string }>>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingCCTV, setEditingCCTV] = useState<CCTVData | null>(null);
  const [form] = Form.useForm();

  // 구역 목록 가져오기
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const regionsRes = await api.get<{ regions: Array<{ uid: number; region_id: string; region_name: string }> }>('/report/setting/getRegions');
        setRegions(regionsRes.regions.map(r => ({
          region_id: r.region_id,
          region_name: r.region_name,
        })));
      } catch (error) {
        console.error('Failed to fetch regions:', error);
        message.error('구역 목록을 불러오는데 실패했습니다.');
      }
    };
    fetchOptions();
  }, []);

  // CCTV 목록 가져오기
  const fetchCCTVList = useCallback(async () => {
    setLoading(true);
    try {
      const cctvRes = await api.get<{ status: string; data: Array<{ cctv_uid: number; cctv_id: string; cctv_kr_name: string; region_id: string; region_name: string; last_update_time?: string }> }>('/report/setting/cctvs');
      
      if (!cctvRes.data || !Array.isArray(cctvRes.data)) {
        throw new Error('Invalid API response format');
      }
      
      let filtered = cctvRes.data;
      
      if (selectedRegion !== 'all') {
        filtered = filtered.filter(c => c.region_id === selectedRegion);
      }

      const list = filtered.map(cctv => ({
        key: String(cctv.cctv_uid),
        uid: cctv.cctv_uid,
        cctv_id: cctv.cctv_id || '',
        cctv_name: cctv.cctv_kr_name || cctv.cctv_id || '',
        region_id: cctv.region_id || '',
        region_name: cctv.region_name || cctv.region_id || '',
        last_update_time: cctv.last_update_time || null,
        status: '정상', // TODO: 실제 데이터 가져오기
      }));

      setCctvList(list);
    } catch (error) {
      console.error('Failed to fetch CCTV list:', error);
      message.error('CCTV 목록을 불러오는데 실패했습니다.');
      setCctvList([]);
    } finally {
      setLoading(false);
    }
  }, [selectedRegion, regions]);

  useEffect(() => {
    fetchCCTVList();
  }, [fetchCCTVList]);

  // 수정 모달 열기
  const handleEdit = (record: CCTVData) => {
    setEditingCCTV(record);
    form.setFieldsValue({
      cctv_id: record.cctv_id,
      cctv_name: record.cctv_name,
      region_id: record.region_id,
      status: record.status,
    });
    setEditModalVisible(true);
  };

  // 수정 저장
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // TODO: 실제 API 호출
      // await api.put(`/report/setting/cctv/${editingCCTV?.uid}`, values);
      
      message.success('CCTV 정보가 수정되었습니다.');
      setEditModalVisible(false);
      setEditingCCTV(null);
      form.resetFields();
      fetchCCTVList();
    } catch (error) {
      console.error('Failed to update CCTV:', error);
      message.error('CCTV 정보 수정에 실패했습니다.');
    }
  };

  // CSV 다운로드
  const handleExportCSV = () => {
    const headers = ['CCTV ID', 'CCTV 명', '구역', '최근 업데이트 시간', '상태'];
    const rows = cctvList.map(row => [
      row.cctv_id,
      row.cctv_name,
      row.region_name,
      row.last_update_time || '',
      row.status || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `CCTV_목록_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      title: 'CCTV ID',
      dataIndex: 'cctv_id',
      key: 'cctv_id',
      width: 150,
    },
    {
      title: 'CCTV 명',
      dataIndex: 'cctv_name',
      key: 'cctv_name',
      width: 200,
    },
    {
      title: '구역',
      dataIndex: 'region_name',
      key: 'region_name',
      width: 150,
    },
    {
      title: '최근 업데이트 시간',
      dataIndex: 'last_update_time',
      key: 'last_update_time',
      width: 200,
      render: (text: string) => text || '-',
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 100,
    },
    {
      title: '작업',
      key: 'action',
      width: 100,
      render: (_: any, record: CCTVData) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(record);
          }}
        >
          수정
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      {/* 타이틀 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>CCTV 관리</Title>
        <Text type="secondary">
          CCTV 목록 및 관리
        </Text>
      </div>

      {/* 검색 조건 */}
      <Card bordered={false} style={{ marginBottom: '24px' }}>
        <Space wrap>
          <Text strong>구역:</Text>
          <Select
            value={selectedRegion}
            onChange={setSelectedRegion}
            style={{ width: 200 }}
          >
            <Select.Option value="all">전체</Select.Option>
            {regions.map(region => (
              <Select.Option key={region.region_id} value={region.region_id}>
                {region.region_name}
              </Select.Option>
            ))}
          </Select>
          <Button type="primary" onClick={fetchCCTVList} loading={loading}>
            검색
          </Button>
        </Space>
      </Card>

      {/* CCTV 목록 */}
      <Card 
        bordered={false} 
        title={<Title level={4} style={{ margin: 0 }}>CCTV 목록</Title>}
        extra={
          <Button icon={<DownloadOutlined />} onClick={handleExportCSV}>
            CSV 다운로드
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={cctvList}
          loading={loading}
          pagination={{ pageSize: 20 }}
          onRow={(record) => ({
            onClick: () => handleEdit(record),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      {/* 수정 모달 */}
      <Modal
        title="CCTV 수정"
        open={editModalVisible}
        onOk={handleSave}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingCCTV(null);
          form.resetFields();
        }}
        okText="저장"
        cancelText="취소"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="cctv_id" label="CCTV ID">
            <Input disabled />
          </Form.Item>
          <Form.Item name="cctv_name" label="CCTV 명" rules={[{ required: true, message: 'CCTV 명을 입력해주세요' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="region_id" label="구역" rules={[{ required: true, message: '구역을 선택해주세요' }]}>
            <Select>
              {regions.map(region => (
                <Select.Option key={region.region_id} value={region.region_id}>
                  {region.region_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="상태">
            <Select>
              <Select.Option value="정상">정상</Select.Option>
              <Select.Option value="점검중">점검중</Select.Option>
              <Select.Option value="오류">오류</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}


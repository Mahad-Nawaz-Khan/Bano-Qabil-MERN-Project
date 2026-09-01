import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Layout,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import { menuApi } from "../services/menuApi.js";
import "./MenuAdmin.css";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

function getError(error) {
  return error.message || "Something went wrong. Please try again.";
}

export default function MenuAdmin() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [itemModal, setItemModal] = useState({ open: false, item: null });
  const [categoryModal, setCategoryModal] = useState({ open: false, category: null });
  const [saving, setSaving] = useState(false);
  const [itemForm] = Form.useForm();
  const [categoryForm] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const [itemsResponse, categoriesResponse] = await Promise.all([
        menuApi.getItems(),
        menuApi.getCategories(),
      ]);
      setItems(itemsResponse.data);
      setCategories(categoriesResponse.data);
      setApiError("");
    } catch (error) {
      setApiError(`${getError(error)} Start the backend and set MONGODB_URI to manage the live menu.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const activeItems = useMemo(() => items.filter((item) => item.isAvailable).length, [items]);

  const openItemModal = (item = null) => {
    itemForm.setFieldsValue(item ? {
      ...item,
      category: item.category?._id || item.category,
    } : { isAvailable: true, price: 0 });
    setItemModal({ open: true, item });
  };

  const saveItem = async (values) => {
    setSaving(true);
    try {
      if (itemModal.item) await menuApi.updateItem(itemModal.item._id, values);
      else await menuApi.createItem(values);
      message.success(itemModal.item ? "Menu item updated" : "Menu item added");
      setItemModal({ open: false, item: null });
      itemForm.resetFields();
      loadData();
    } catch (error) {
      message.error(getError(error));
    } finally { setSaving(false); }
  };

  const saveCategory = async (values) => {
    setSaving(true);
    try {
      if (categoryModal.category) await menuApi.updateCategory(categoryModal.category._id, values);
      else await menuApi.createCategory(values);
      message.success(categoryModal.category ? "Category updated" : "Category added");
      setCategoryModal({ open: false, category: null });
      categoryForm.resetFields();
      loadData();
    } catch (error) {
      message.error(getError(error));
    } finally { setSaving(false); }
  };

  const itemColumns = [
    { title: "Dish", dataIndex: "name", render: (name, item) => <Space><div className="food-thumb">{item.image ? <img src={item.image} alt="" /> : "🍽"}</div><div><strong>{name}</strong><br /><Text type="secondary" ellipsis>{item.description || "No description"}</Text></div></Space> },
    { title: "Category", dataIndex: "category", render: (category) => <Tag color="gold">{category?.name || "Unassigned"}</Tag> },
    { title: "Price", dataIndex: "price", render: (price) => `Rs ${Number(price).toLocaleString()}` },
    { title: "Status", dataIndex: "isAvailable", render: (available) => <Tag color={available ? "green" : "default"}>{available ? "Available" : "Hidden"}</Tag> },
    { title: "Actions", key: "actions", render: (_, item) => <Space><Button type="link" onClick={() => openItemModal(item)}>Edit</Button><Popconfirm title="Delete this menu item?" onConfirm={async () => { try { await menuApi.deleteItem(item._id); message.success("Menu item deleted"); loadData(); } catch (error) { message.error(getError(error)); } }}><Button type="link" danger>Delete</Button></Popconfirm></Space> },
  ];

  const categoryColumns = [
    { title: "Category", dataIndex: "name", render: (name, category) => <div><strong>{name}</strong><br /><Text type="secondary">{category.description || "No description"}</Text></div> },
    { title: "Menu items", key: "count", render: (_, category) => items.filter((item) => (item.category?._id || item.category) === category._id).length },
    { title: "Actions", key: "actions", render: (_, category) => <Space><Button type="link" onClick={() => { categoryForm.setFieldsValue(category); setCategoryModal({ open: true, category }); }}>Edit</Button><Popconfirm title="Delete this category? Items must be moved or deleted first." onConfirm={async () => { try { await menuApi.deleteCategory(category._id); message.success("Category deleted"); loadData(); } catch (error) { message.error(getError(error)); } }}><Button type="link" danger>Delete</Button></Popconfirm></Space> },
  ];

  return (
    <Layout className="admin-layout">
      <Header className="admin-header"><a href="http://localhost:5173" className="brand">GHALIB <span>ADMIN</span></a><a href="http://localhost:5173">View restaurant</a></Header>
      <Content className="admin-content">
        <div className="admin-title"><div><Text className="eyebrow">RESTAURANT CONTROL</Text><Title level={2}>Menu management</Title><Text type="secondary">Add, edit, hide, or remove dishes and categories.</Text></div><Button type="primary" size="large" onClick={() => openItemModal()}>+ Add menu item</Button></div>
        {apiError && <Alert className="api-alert" type="warning" showIcon message="API is not connected" description={apiError} action={<Button size="small" onClick={loadData}>Retry</Button>} />}
        <Row gutter={[16, 16]} className="stats-row"><Col xs={24} sm={8}><Card><Statistic title="Total dishes" value={items.length} /></Card></Col><Col xs={24} sm={8}><Card><Statistic title="Available now" value={activeItems} valueStyle={{ color: "#3f8600" }} /></Card></Col><Col xs={24} sm={8}><Card><Statistic title="Categories" value={categories.length} /></Card></Col></Row>
        <Card className="admin-table-card"><Tabs items={[
          { key: "items", label: "Menu items", children: items.length || loading ? <Table rowKey="_id" loading={loading} columns={itemColumns} dataSource={items} scroll={{ x: 800 }} pagination={{ pageSize: 8 }} /> : <Empty description="No menu items yet" /> },
          { key: "categories", label: "Categories", children: <><Button className="new-category" onClick={() => { categoryForm.resetFields(); setCategoryModal({ open: true, category: null }); }}>+ Add category</Button><Table rowKey="_id" loading={loading} columns={categoryColumns} dataSource={categories} scroll={{ x: 650 }} pagination={false} /></> },
        ]} /></Card>
      </Content>

      <Modal title={itemModal.item ? "Edit menu item" : "Add menu item"} open={itemModal.open} onCancel={() => setItemModal({ open: false, item: null })} footer={null} destroyOnClose>
        <Form form={itemForm} layout="vertical" onFinish={saveItem} preserve={false}>
          <Form.Item name="name" label="Dish name" rules={[{ required: true, message: "Dish name is required" }]}><Input placeholder="e.g. Chicken Mandi" /></Form.Item>
          <Row gutter={12}><Col span={12}><Form.Item name="category" label="Category" rules={[{ required: true, message: "Choose a category" }]}><Select placeholder="Choose category" options={categories.map((category) => ({ label: category.name, value: category._id }))} /></Form.Item></Col><Col span={12}><Form.Item name="price" label="Price (Rs)" rules={[{ required: true, message: "Price is required" }]}><InputNumber min={0} className="full-width" /></Form.Item></Col></Row>
          <Form.Item name="description" label="Description"><Input.TextArea rows={3} placeholder="Short dish description" /></Form.Item>
          <Form.Item name="image" label="Image URL"><Input placeholder="https://…" /></Form.Item>
          <Form.Item name="isAvailable" label="Visible on menu" valuePropName="checked"><Switch checkedChildren="Visible" unCheckedChildren="Hidden" /></Form.Item>
          <div className="modal-actions"><Button onClick={() => setItemModal({ open: false, item: null })}>Cancel</Button><Button type="primary" htmlType="submit" loading={saving}>Save item</Button></div>
        </Form>
      </Modal>

      <Modal title={categoryModal.category ? "Edit category" : "Add category"} open={categoryModal.open} onCancel={() => setCategoryModal({ open: false, category: null })} footer={null} destroyOnClose>
        <Form form={categoryForm} layout="vertical" onFinish={saveCategory} preserve={false}><Form.Item name="name" label="Category name" rules={[{ required: true, message: "Category name is required" }]}><Input placeholder="e.g. Desserts" /></Form.Item><Form.Item name="description" label="Description"><Input.TextArea rows={3} /></Form.Item><div className="modal-actions"><Button onClick={() => setCategoryModal({ open: false, category: null })}>Cancel</Button><Button type="primary" htmlType="submit" loading={saving}>Save category</Button></div></Form>
      </Modal>
    </Layout>
  );
}

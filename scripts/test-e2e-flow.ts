import assert from 'node:assert';

const API_URL = process.env.API_URL || 'http://localhost:4000';

async function request(endpoint: string, options: RequestInit = {}, token?: string) {
  const headers: Record<string, string> = {
    ...(options.headers as any),
  };
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error(`[${res.status}] ${endpoint}: ${JSON.stringify(json)}`);
  }
  return json?.data;
}

async function runE2ETest() {
  console.log('--- BẮT ĐẦU E2E VERTICAL SLICE TEST ---');

  // 1. Health check
  console.log('1. Kiểm tra API Health...');
  const healthRes = await fetch(`${API_URL}/health`).then((r) => r.json());
  assert.strictEqual(healthRes.status, 'ok', 'API health status must be ok');
  console.log('   OK: API is healthy.');

  // 2. Fetch products & search
  console.log('2. Lấy danh sách sản phẩm & tìm kiếm...');
  const products = await request('/store/products');
  assert(Array.isArray(products) && products.length > 0, 'Products list must not be empty');
  console.log(`   OK: Tìm thấy ${products.length} sản phẩm.`);

  const searchResults = await request('/store/products?q=Essential');
  assert(Array.isArray(searchResults) && searchResults.length > 0, 'Search by "Essential" should return products');
  const targetProduct = searchResults[0];
  const targetVariant = targetProduct.variants?.[0];
  assert(targetVariant, 'Product must have at least one variant');
  console.log(`   OK: Tìm thấy sản phẩm "${targetProduct.title}", SKU: ${targetVariant.sku}`);

  // 3. Register or Login Customer
  console.log('3. Đăng nhập Customer...');
  const customerEmail = `customer_${Date.now()}@test.local`;
  const customerPass = 'Password123!';
  
  const regRes = await request('/store/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: customerEmail,
      password: customerPass,
      firstName: 'Test',
      lastName: 'Customer',
    }),
  });
  assert(regRes?.token, 'Customer register should return a JWT token');
  const customerToken = regRes.token;
  console.log(`   OK: Đăng ký thành công customer token (${customerEmail}).`);

  // 4. Create Cart & Add Item
  console.log('4. Tạo giỏ hàng & thêm sản phẩm...');
  const cart = await request('/store/carts', { method: 'POST' }, customerToken);
  assert(cart?.id, 'Cart creation must return a cart id');
  console.log(`   OK: Tạo cart id: ${cart.id}`);

  const item = await request(
    `/store/carts/${cart.id}/items`,
    {
      method: 'POST',
      body: JSON.stringify({
        variantId: targetVariant.id,
        quantity: 2,
      }),
    },
    customerToken
  );
  assert.strictEqual(item.quantity, 2, 'Cart item quantity should be 2');
  console.log(`   OK: Đã thêm ${item.quantity} sản phẩm vào giỏ.`);

  // Verify Cart details
  const fetchedCart = await request(`/store/carts/${cart.id}`, {}, customerToken);
  assert.strictEqual(fetchedCart.items.length, 1, 'Cart should contain 1 item line');
  assert.strictEqual(fetchedCart.items[0].quantity, 2);
  console.log(`   OK: Giỏ hàng tổng tiền: ${fetchedCart.total} VND.`);

  // 5. Checkout with UUID Idempotency Key
  console.log('5. Checkout với Idempotency Key...');
  const idempotencyKey = crypto.randomUUID();
  const order = await request(
    `/store/carts/${cart.id}/checkout`,
    {
      method: 'POST',
      body: JSON.stringify({ idempotencyKey }),
    },
    customerToken
  );
  assert(order?.id, 'Checkout must produce an order');
  assert.strictEqual(order.status, 'PENDING', 'Order status initially should be PENDING');
  console.log(`   OK: Đơn hàng tạo thành công: #${order.id}, trạng thái: ${order.status}`);

  // 6. Test Idempotency Retry
  console.log('6. Kiểm tra chống trùng lặp (Idempotency Retry)...');
  const retryOrder = await request(
    `/store/carts/${cart.id}/checkout`,
    {
      method: 'POST',
      body: JSON.stringify({ idempotencyKey }),
    },
    customerToken
  );
  assert.strictEqual(retryOrder.id, order.id, 'Retry with same key must return the SAME order');
  console.log(`   OK: Retry trả về cùng order ID (#${retryOrder.id}), không bị duplicate billing/order!`);

  // 7. Customer views order list & single order detail
  console.log('7. Khách hàng xem danh sách và chi tiết đơn hàng...');
  const customerOrders = await request('/store/orders', {}, customerToken);
  assert(customerOrders.some((o: any) => o.id === order.id), 'Customer order list must contain the new order');

  const orderDetail = await request(`/store/orders/${order.id}`, {}, customerToken);
  assert.strictEqual(orderDetail.id, order.id);
  assert(Array.isArray(orderDetail.statusHistory) && orderDetail.statusHistory.length >= 1);
  console.log(`   OK: Xem chi tiết đơn hàng thành công, lịch sử trạng thái: ${orderDetail.statusHistory.length} mốc.`);

  // 8. Admin login
  console.log('8. Admin đăng nhập...');
  const adminLogin = await request('/store/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@commerce.local',
      password: 'Admin@123456',
    }),
  });
  assert(adminLogin?.token, 'Admin login must return a token');
  assert(['ADMIN', 'STAFF'].includes(adminLogin.user.role), 'User must have ADMIN or STAFF role');
  const adminToken = adminLogin.token;
  console.log(`   OK: Admin login thành công (Role: ${adminLogin.user.role}).`);

  // 9. Admin views all orders
  console.log('9. Admin xem toàn bộ danh sách đơn hàng...');
  const adminOrders = await request('/admin/orders', {}, adminToken);
  assert(Array.isArray(adminOrders));
  assert(adminOrders.some((o: any) => o.id === order.id), 'Admin orders must include created order');
  console.log(`   OK: Admin thấy ${adminOrders.length} đơn hàng.`);

  // 10. Admin updates order status
  console.log('10. Admin cập nhật trạng thái đơn hàng sang "PROCESSING"...');
  const updatedOrder = await request(
    `/admin/orders/${order.id}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status: 'PROCESSING' }),
    },
    adminToken
  );
  assert.strictEqual(updatedOrder.status, 'PROCESSING', 'Updated status must be PROCESSING');
  console.log(`   OK: Đơn hàng đã chuyển sang trạng thái: ${updatedOrder.status}`);

  // Verify status history
  const finalOrderDetail = await request(`/store/orders/${order.id}`, {}, customerToken);
  assert.strictEqual(finalOrderDetail.status, 'PROCESSING');
  const latestHistory = finalOrderDetail.statusHistory[finalOrderDetail.statusHistory.length - 1];
  assert.strictEqual(latestHistory.toStatus, 'PROCESSING');
  console.log(`   OK: Status history đã ghi nhận chuyển sang PROCESSING bởi Admin.`);

  console.log('\n========================================');
  console.log('>>> TẤT CẢ CÁC BƯỚC E2E TEST ĐỀU THÀNH CÔNG RỰC RỠ! <<<');
  console.log('========================================');
}

runE2ETest().catch((err) => {
  console.error('\nE2E Test Thất Bại:', err);
  process.exit(1);
});

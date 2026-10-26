"""Generate editable ERD pages and matching SVG/PNG from verified schema metadata.

This documentation tool only reads local files and writes diagram artifacts.
It never connects to the application or its database.
"""

from pathlib import Path
from collections import Counter
import heapq
import html
import json
import math
import re
import xml.etree.ElementTree as ET

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent
CATALOG = ROOT / "evidence/schema-survey-2026-10-24/catalog.json"
WIDTH, HEIGHT = 360, 280
GRID = 20
INK = "#172033"
MUTED = "#475569"
COLORS = {"fk": "#2563eb", "link": "#15803d", "ref": "#b45309"}
DASHES = {"fk": (), "link": (3, 6), "ref": (11, 7)}
DOMAINS = {
  "customer": ("#475569", "#f1f5f9"),
  "catalog": ("#0e7490", "#ecfeff"),
  "cart": ("#1d4ed8", "#eff6ff"),
  "order": ("#7c3aed", "#f5f3ff"),
  "payment": ("#047857", "#ecfdf5"),
  "inventory": ("#c2410c", "#fff7ed"),
}
FONT_PATHS = {
  "regular": Path("C:/Windows/Fonts/arial.ttf"),
  "bold": Path("C:/Windows/Fonts/arialbd.ttf"),
  "mono": Path("C:/Windows/Fonts/consola.ttf"),
}
FONTS = {}


def font(size, kind="regular"):
  key = (size, kind)
  if key not in FONTS:
    FONTS[key] = ImageFont.truetype(str(FONT_PATHS[kind]), size)
  return FONTS[key]


def field(name, marker=""):
  return {"name": name, "marker": marker}


def table(name, title, domain, fields, notes):
  return {"name": name, "title": title, "domain": domain, "fields": fields, "notes": notes}


TABLES = [
  table("customer", "Customer", "customer", [field("id", "PK"), field("email"), field("has_account")], ["UQ*: (email, has_account)", "Nguồn: snapshot v1 ngày 17/10"]),
  table("product", "Product", "catalog", [field("id", "PK"), field("title"), field("handle", "UQ*"), field("status")], ["Catalog; giá thuộc Pricing", "Nguồn: snapshot v1 ngày 17/10"]),
  table("product_variant", "ProductVariant", "catalog", [field("id", "PK"), field("product_id", "FK"), field("sku", "UQ*"), field("manage_inventory"), field("allow_backorder")], ["Cấu hình bán của sản phẩm", "Không lưu số tồn trên variant"]),
  table("product_variant_inventory_item", "Variant × Inventory", "inventory", [field("variant_id", "PK1"), field("inventory_item_id", "PK2"), field("required_quantity"), field("id", "idx")], ["N:N; PK ghép hai ID", "required_quantity: định mức / variant"]),
  table("inventory_item", "InventoryItem", "inventory", [field("id", "PK"), field("sku", "UQ*"), field("title"), field("unit_of_measure")], ["Đơn vị hàng được quản lý tồn", "Số tồn chi tiết nằm ở InventoryLevel"]),
  table("inventory_level", "InventoryLevel", "inventory", [field("id", "PK"), field("inventory_item_id", "FK"), field("location_id", "REF"), field("stocked_quantity"), field("reserved_quantity"), field("incoming_quantity")], ["UQ*: (inventory_item_id, location_id)", "available = stocked − reserved (tính)"]),
  table("stock_location", "StockLocation", "inventory", [field("id", "PK"), field("name"), field("address_id", "FK ngoài")], ["Kho / địa điểm lưu hàng", "Địa chỉ nằm ngoài phạm vi hình"]),
  table("cart", "Cart", "cart", [field("id", "PK"), field("customer_id", "REF"), field("currency_code"), field("completed_at")], ["completed_at: hoàn tất giỏ", "Không có cột cart.status"]),
  table("cart_line_item", "CartLineItem", "cart", [field("id", "PK"), field("cart_id", "FK"), field("product_id", "REF"), field("variant_id", "REF"), field("quantity"), field("unit_price")], ["quantity: integer", "Snapshot dòng giỏ hàng"]),
  table("order", "Order", "order", [field("id", "PK"), field("customer_id", "REF"), field("currency_code"), field("status"), field("version")], ["Lượng hàng phải đọc đúng version", "cart_id nằm ở bảng nối order_cart"]),
  table("order_item", "OrderItem", "order", [field("id", "PK"), field("order_id", "FK"), field("item_id", "FK"), field("version"), field("quantity")], ["Lượng đặt / xử lý theo version", "item_id không UNIQUE"]),
  table("order_line_item", "OrderLineItem", "order", [field("id", "PK"), field("totals_id", "FK cũ"), field("product_id", "REF"), field("variant_id", "REF"), field("variant_sku"), field("unit_price")], ["Snapshot; không order_id / quantity", "totals_id: FK lịch sử còn trong DB"]),
  table("order_cart", "Order × Cart", "order", [field("order_id", "PK1"), field("cart_id", "PK2"), field("id", "idx")], ["LINK; không FK hai phía", "PK cặp không cưỡng chế 1:1"]),
  table("order_summary", "OrderSummary", "order", [field("id", "PK"), field("order_id", "FK"), field("version"), field("totals")], ["Tổng hợp theo phiên bản", "Không suy ra quan hệ 1:1"]),
  table("payment_collection", "PaymentCollection", "payment", [field("id", "PK"), field("currency_code"), field("amount"), field("status"), field("captured_amount"), field("refunded_amount")], ["Trạng thái tổng hợp thanh toán", "Còn authorized_amount / raw_* trong DB"]),
  table("payment_session", "PaymentSession", "payment", [field("id", "PK"), field("payment_collection_id", "FK"), field("provider_id", "REF ngoài"), field("amount"), field("status")], ["Trạng thái phiên với provider", "R25: tối đa 1 payment chưa xóa"]),
  table("payment", "Payment", "payment", [field("id", "PK"), field("payment_collection_id", "FK"), field("payment_session_id", "UQ* REF"), field("amount"), field("captured_at"), field("canceled_at")], ["Không có cột payment.status", "Session: UNIQUE active nhưng không FK"]),
  table("cart_payment_collection", "Cart × Payment", "payment", [field("cart_id", "PK1"), field("payment_collection_id", "PK2"), field("id", "idx")], ["LINK; không FK hai phía", "PK cặp không cưỡng chế 1:1"]),
  table("order_payment_collection", "Order × Payment", "payment", [field("order_id", "PK1"), field("payment_collection_id", "PK2"), field("id", "idx")], ["API order.payment_collections: list", "LINK; không UNIQUE riêng từng ID"]),
  table("reservation_item", "ReservationItem", "inventory", [field("id", "PK"), field("inventory_item_id", "FK"), field("location_id", "REF"), field("line_item_id", "REF"), field("quantity"), field("allow_backorder")], ["line_item_id: dòng đơn trong checkout", "Không có inventory_level_id"]),
  table("capture", "Capture", "payment", [field("id", "PK"), field("payment_id", "FK"), field("amount")], ["Các lần capture của payment", "amount đi kèm raw_amount trong DB"]),
  table("refund", "Refund", "payment", [field("id", "PK"), field("payment_id", "FK"), field("amount"), field("refund_reason_id", "REF ngoài")], ["Các lần hoàn tiền", "RefundReason nằm ngoài phạm vi hình"]),
]
BY_NAME = {item["name"]: item for item in TABLES}


def relationship(number, source, target, column, kind, source_card="1", target_card="0..N", subtype="", note=""):
  return {"id": f"R{number}", "source": source, "target": target, "target_column": column, "source_column": "id", "kind": kind, "source_card": source_card, "target_card": target_card, "subtype": subtype, "note": note}


RELATIONSHIPS = [
  relationship(1, "customer", "cart", "customer_id", "ref", "0..1", subtype="read-only"),
  relationship(2, "cart", "cart_line_item", "cart_id", "fk"),
  relationship(3, "product", "product_variant", "product_id", "fk", "0..1"),
  relationship(4, "product_variant", "cart_line_item", "variant_id", "ref", "0..1", subtype="read-only"),
  relationship(5, "product", "cart_line_item", "product_id", "ref", "0..1", subtype="read-only"),
  relationship(6, "product_variant", "product_variant_inventory_item", "variant_id", "link"),
  relationship(7, "inventory_item", "product_variant_inventory_item", "inventory_item_id", "link"),
  relationship(8, "inventory_item", "inventory_level", "inventory_item_id", "fk"),
  relationship(9, "stock_location", "inventory_level", "location_id", "ref", subtype="read-only"),
  relationship(10, "customer", "order", "customer_id", "ref", "0..1", subtype="read-only"),
  relationship(11, "order", "order_item", "order_id", "fk"),
  relationship(12, "order_line_item", "order_item", "item_id", "fk", note="Nhiều bản ghi OrderItem theo version được phép"),
  relationship(13, "order_item", "order_line_item", "totals_id", "fk", "0..1", subtype="legacy", note="FK còn trong DB, model OrderLineItem hiện không khai báo totals_id"),
  relationship(14, "product_variant", "order_line_item", "variant_id", "ref", "0..1", subtype="read-only"),
  relationship(15, "product", "order_line_item", "product_id", "ref", "0..1", subtype="read-only"),
  relationship(16, "order", "order_summary", "order_id", "fk"),
  relationship(17, "order", "order_cart", "order_id", "link"),
  relationship(18, "cart", "order_cart", "cart_id", "link"),
  relationship(19, "cart", "cart_payment_collection", "cart_id", "link"),
  relationship(20, "payment_collection", "cart_payment_collection", "payment_collection_id", "link"),
  relationship(21, "order", "order_payment_collection", "order_id", "link"),
  relationship(22, "payment_collection", "order_payment_collection", "payment_collection_id", "link"),
  relationship(23, "payment_collection", "payment_session", "payment_collection_id", "fk"),
  relationship(24, "payment_collection", "payment", "payment_collection_id", "fk"),
  relationship(25, "payment_session", "payment", "payment_session_id", "ref", target_card="0..1*", subtype="model-reference", note="0..1 áp dụng payment chưa xóa; UNIQUE WHERE deleted_at IS NULL; không FK"),
  relationship(26, "payment", "capture", "payment_id", "fk"),
  relationship(27, "payment", "refund", "payment_id", "fk"),
  relationship(28, "inventory_item", "reservation_item", "inventory_item_id", "fk"),
  relationship(29, "stock_location", "reservation_item", "location_id", "ref", subtype="plain-id"),
  relationship(30, "order_line_item", "reservation_item", "line_item_id", "ref", "0..1", subtype="checkout-id", note="Trong complete-cart là ID OrderLineItem; reservation khác có thể không gắn dòng đơn"),
]
BY_ID = {item["id"]: item for item in RELATIONSHIPS}


def row(names, y, x=60, step=460):
  return {name: (x + index * step, y) for index, name in enumerate(names)}


PAGES = [
  {"slug": "business", "name": "01 · Tổng quan", "title": "Medusa · ERD nghiệp vụ v2", "size": (2780, 2220),
   "subtitle": "22 bảng · trang tổng quan giữ 22 cạnh chính · ba trang chi tiết thể hiện đủ 30 quan hệ R1–R30",
   "nodes": {**row(["customer", "cart", "cart_line_item", "cart_payment_collection", "payment_collection", "payment_session"], 280), **row(["product", "product_variant", "product_variant_inventory_item", "order_payment_collection", "payment", "capture"], 700), **row(["stock_location", "inventory_level", "inventory_item", "order_cart", "order", "refund"], 1120), **row(["order_line_item", "order_item", "order_summary"], 1540, 1440), "reservation_item": (980, 1540)},
   "edges": [f"R{n}" for n in [1, 2, 3, 6, 7, 8, 9, 11, 12, 16, 17, 18, 19, 20, 21, 22, 23, 24, 26, 27, 28, 30]],
   "callouts": [(60, 1540, 820, 280, "Đọc đầy đủ ở ba trang chi tiết", ["Cart–Order: R1–R5, R10–R18, gồm FK totals_id lịch sử.", "Payment: R19–R27; R25 chỉ 0..1 với payment chưa xóa.", "Inventory: R6–R9, R28–R30; Variant–Inventory là N:N.", "Tổng toàn bộ: 12 FK, 8 cạnh LINK, 10 cạnh REF.", "Mỗi bảng là một đối tượng có thể chỉnh sửa trong draw.io."]) ]},
  {"slug": "cart-order", "name": "02 · Cart và Order", "title": "ERD v2 · Cart, Order và snapshot dòng hàng", "size": (2320, 1660),
   "subtitle": "10 bảng · 14 quan hệ · giữ CartLineItem, OrderItem và OrderLineItem thành ba thực thể riêng",
   "nodes": {**row(["customer", "cart", "cart_line_item", "product", "product_variant"], 280), **row(["order_summary", "order", "order_cart", "order_item", "order_line_item"], 940)},
   "edges": [f"R{n}" for n in [1, 2, 3, 4, 5, 10, 11, 12, 13, 14, 15, 16, 17, 18]], "callouts": []},
  {"slug": "payment", "name": "03 · Payment", "title": "ERD v2 · Liên kết và xử lý thanh toán", "size": (1760, 2160),
   "subtitle": "9 bảng · 9 quan hệ · trạng thái nằm ở PaymentCollection và PaymentSession",
   "nodes": {**row(["cart", "cart_payment_collection", "payment_session"], 280, step=640), **row(["order", "order_payment_collection", "payment_collection"], 860, step=640), **row(["capture", "payment", "refund"], 1440, step=640)},
   "edges": [f"R{n}" for n in range(19, 28)], "callouts": []},
  {"slug": "inventory", "name": "04 · Inventory", "title": "ERD v2 · Inventory, kho và reservation", "size": (1760, 2220),
   "subtitle": "7 bảng · 7 quan hệ · các cạnh LINK cho thấy Variant–Inventory N:N",
   "nodes": {**row(["product_variant", "product_variant_inventory_item", "inventory_item"], 280, step=640), **row(["stock_location", "inventory_level", "reservation_item"], 900, step=640), "order_line_item": (1340, 1520)},
   "edges": [f"R{n}" for n in [6, 7, 8, 9, 28, 29, 30]],
   "callouts": [(60, 1520, 1000, 280, "Tồn có thể bán và lượng giữ hàng", ["Một item tại một kho: available = stocked − reserved.", "Lượng giữ = số lượng đặt × required_quantity.", "incoming_quantity không cộng vào lượng có thể bán.", "Reservation dùng cặp (inventory_item_id, location_id) để tìm level.", "Không có FK Reservation → InventoryLevel hay Reservation → CartLineItem."]) ]},
]


def load_metadata():
  catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
  metadata = {item["table_name"]: item for item in catalog["tables"]}
  old_sql = (ROOT / "medusa-erd-v1.sql").read_text(encoding="utf-8")
  for name in ["customer", "product"]:
    body = re.search(r"CREATE TABLE medusa_erd_v1\." + name + r" \((.*?)\n\);", old_sql, re.S).group(1)
    columns = []
    for line in body.splitlines():
      matched = re.match(r"\s+(\w+) (.*?)(?:,)?$", line)
      if not matched:
        continue
      definition = matched.group(2).rstrip(",")
      dtype = re.split(r" DEFAULT | NOT NULL", definition)[0]
      columns.append({"column_name": matched.group(1), "udt_name": {"boolean": "bool", "integer": "int4", "timestamp with time zone": "timestamptz"}.get(dtype, dtype), "is_nullable": "NO" if "NOT NULL" in definition else "YES"})
    metadata[name] = {"table_name": name, "columns": columns, "provenance": "v1 DDL snapshot 2026-10-17"}
  for node in TABLES:
    node["provenance"] = "snapshot 17/10/2026" if node["name"] in ["customer", "product"] else "catalog live 24/10/2026"
    columns = {item["column_name"]: item for item in metadata[node["name"]]["columns"]}
    for item in node["fields"]:
      assert item["name"] in columns, (node["name"], item["name"])
      item.update({"nullable": columns[item["name"]]["is_nullable"] == "YES", "type": columns[item["name"]]["udt_name"]})
  return metadata


def simplify(points):
  result = []
  for point in points:
    if result and point == result[-1]:
      continue
    while len(result) >= 2 and (result[-2][0] == result[-1][0] == point[0] or result[-2][1] == result[-1][1] == point[1]):
      result.pop()
    result.append(point)
  return result


def inside(point, rect, padding=0):
  x, y, width, height = rect
  return x - padding <= point[0] <= x + width + padding and y - padding <= point[1] <= y + height + padding


def route_page(page):
  width, height = page["size"]
  rectangles = [(x, y, WIDTH, HEIGHT) for x, y in page["nodes"].values()]
  rectangles += [item[:4] for item in page["callouts"]]
  blocked = set()
  for x, y, w, h in rectangles:
    for gx in range(x - 20, x + w + 21, GRID):
      for gy in range(y - 20, y + h + 21, GRID):
        blocked.add((gx, gy))
  used_ports = Counter()
  occupied = Counter()

  def port(name, side):
    x, y = page["nodes"][name]
    sequence = [0, -40, 40, -80, 80, -100, 100]
    shift = sequence[used_ports[(name, side)] % len(sequence)]
    used_ports[(name, side)] += 1
    if side in ["L", "R"]:
      point = (x if side == "L" else x + WIDTH, y + HEIGHT // 2 + shift)
      lead = (point[0] + (-40 if side == "L" else 40), point[1])
    else:
      point = (x + WIDTH // 2 + shift, y if side == "T" else y + HEIGHT)
      lead = (point[0], point[1] + (-40 if side == "T" else 40))
    return point, lead

  def pathfind(start, goal):
    heap = [(0, 0, start[0], start[1], -1)]
    distance = {(start[0], start[1], -1): 0}
    previous = {}
    endpoint = None
    while heap:
      _, cost, x, y, direction = heapq.heappop(heap)
      current = (x, y, direction)
      if cost > distance[current] + 0.00001:
        continue
      if (x, y) == goal:
        endpoint = current
        break
      for next_direction, (dx, dy) in enumerate([(GRID, 0), (0, GRID), (-GRID, 0), (0, -GRID)]):
        next_point = (x + dx, y + dy)
        if not 20 <= next_point[0] <= width - 20 or not 240 <= next_point[1] <= height - 240:
          continue
        if next_point in blocked and next_point not in [start, goal]:
          continue
        extra = 1 + (0.7 if direction not in [-1, next_direction] else 0) + occupied[next_point] * 1.6
        next_cost = cost + extra
        state = (*next_point, next_direction)
        if next_cost < distance.get(state, math.inf):
          distance[state] = next_cost
          previous[state] = current
          estimate = (abs(next_point[0] - goal[0]) + abs(next_point[1] - goal[1])) / GRID
          heapq.heappush(heap, (next_cost + estimate, next_cost, *state))
    if endpoint is None:
      raise RuntimeError(f"No route on {page['slug']}: {start} to {goal}")
    result = []
    while endpoint in previous:
      result.append(endpoint[:2])
      endpoint = previous[endpoint]
    result.append(start)
    return result[::-1]

  routed = []
  for edge_id in page["edges"]:
    edge = dict(BY_ID[edge_id])
    sx, sy = page["nodes"][edge["source"]]
    tx, ty = page["nodes"][edge["target"]]
    if abs(tx - sx) >= abs(ty - sy):
      sides = ("R", "L") if tx > sx else ("L", "R")
    else:
      sides = ("B", "T") if ty > sy else ("T", "B")
    source_point, source_lead = port(edge["source"], sides[0])
    target_point, target_lead = port(edge["target"], sides[1])
    middle = pathfind(source_lead, target_lead)
    for point in middle:
      occupied[point] += 1
    edge["points"] = simplify([source_point] + middle + [target_point])
    edge["sides"] = sides
    edge["label"] = edge_id
    segments = list(zip(edge["points"], edge["points"][1:]))
    segment = max(segments, key=lambda item: abs(item[0][0] - item[1][0]) + abs(item[0][1] - item[1][1]) + (50 if item[0][1] == item[1][1] else 0))
    edge["label_point"] = ((segment[0][0] + segment[1][0]) / 2, (segment[0][1] + segment[1][1]) / 2)
    routed.append(edge)
  page["routed"] = routed


class Canvas:
  def __init__(self, width, height, title):
    self.image = Image.new("RGB", (width, height), "white")
    self.draw = ImageDraw.Draw(self.image)
    self.svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img">', f"<title>{html.escape(title)}</title>", '<rect width="100%" height="100%" fill="white"/>']

  def rect(self, x, y, width, height, fill="white", stroke=None, radius=0):
    self.draw.rounded_rectangle((x, y, x + width, y + height), radius=radius, fill=fill, outline=stroke, width=1)
    self.svg.append(f'<rect x="{x}" y="{y}" width="{width}" height="{height}" rx="{radius}" fill="{fill}"' + (f' stroke="{stroke}"' if stroke else "") + "/>")

  def text(self, x, y, value, size=16, color=INK, kind="regular", anchor="start"):
    selected = font(size, kind)
    length = selected.getlength(value)
    left = x - length if anchor == "end" else x - length / 2 if anchor == "middle" else x
    self.draw.text((left, y), value, font=selected, fill=color, anchor="ls")
    family = "Consolas, monospace" if kind == "mono" else "Arial, sans-serif"
    self.svg.append(f'<text x="{x}" y="{y}" font-family="{family}" font-size="{size}" fill="{color}" text-anchor="{anchor}"' + (' font-weight="700"' if kind == "bold" else "") + f">{html.escape(value)}</text>")

  def line(self, points, color, width=3, dash=()):
    self.svg.append('<polyline points="' + " ".join(f"{x},{y}" for x, y in points) + f'" fill="none" stroke="{color}" stroke-width="{width}" stroke-linejoin="round"' + (' stroke-dasharray="' + " ".join(str(item) for item in dash) + '"' if dash else "") + "/>")
    if not dash:
      self.draw.line(points, fill=color, width=width, joint="curve")
      return
    for start, end in zip(points, points[1:]):
      dx, dy = end[0] - start[0], end[1] - start[1]
      distance = math.hypot(dx, dy)
      cursor = 0
      index = 0
      while cursor < distance:
        length = min(dash[index % len(dash)], distance - cursor)
        if index % 2 == 0 and distance:
          self.draw.line([(start[0] + dx * cursor / distance, start[1] + dy * cursor / distance), (start[0] + dx * (cursor + length) / distance, start[1] + dy * (cursor + length) / distance)], fill=color, width=width)
        cursor += length
        index += 1

  def paragraph(self, x, y, value, width, size=15, line_height=23, color=MUTED):
    words = value.split()
    line = ""
    for word in words:
      candidate = (line + " " + word).strip()
      if line and font(size).getlength(candidate) > width:
        self.text(x, y, line, size, color)
        y += line_height
        line = word
      else:
        line = candidate
    if line:
      self.text(x, y, line, size, color)
      y += line_height
    return y

  def save(self, base):
    self.svg.append("</svg>")
    (ROOT / (base + ".svg")).write_text("\n".join(self.svg) + "\n", encoding="utf-8")
    self.image.save(ROOT / (base + ".png"), optimize=True)


def display_field(item):
  name = item["name"] + ("?" if item["nullable"] else "")
  dtype = {"int4": "integer", "bool": "boolean", "timestamptz": "timestamp", "order_status_enum": "enum"}.get(item["type"], item["type"])
  right = (item["marker"] + " · " if item["marker"] else "") + dtype
  return name, right


def endpoint_label(point, side, value, is_source=True):
  width = font(14, "bold").getlength(value) + 10
  if side == "L":
    return point[0] - 13 - width, point[1] - 40 if is_source else point[1] + 15, width, 22
  if side == "R":
    return point[0] + 13, point[1] - 40 if is_source else point[1] + 15, width, 22
  left = point[0] + 12 if is_source else point[0] - width - 12
  if side == "T":
    return left, point[1] - 28, width, 22
  return left, point[1] + 9, width, 22


def overlaps(a, b, padding=3):
  return a[0] < b[0]+b[2]+padding and a[0]+a[2]+padding > b[0] and a[1] < b[1]+b[3]+padding and a[1]+a[3]+padding > b[1]


def layout_labels(page):
  obstacles = [(x, y, WIDTH, HEIGHT) for x, y in page["nodes"].values()]
  obstacles += [item[:4] for item in page["callouts"]]
  placed = []
  for edge in page["routed"]:
    label_width = font(14, "bold").getlength(edge["label"]) + 16
    segments = sorted(zip(edge["points"], edge["points"][1:]), key=lambda item: abs(item[0][0]-item[1][0])+abs(item[0][1]-item[1][1])+(50 if item[0][1] == item[1][1] else 0), reverse=True)
    chosen = None
    for a, b in segments:
      for fraction in [0.5, 0.33, 0.67, 0.2, 0.8]:
        x, y = a[0]+(b[0]-a[0])*fraction, a[1]+(b[1]-a[1])*fraction
        box = (x-label_width/2, y-13, label_width, 24)
        if not any(overlaps(box, item) for item in obstacles+placed):
          chosen = (x, y, box)
          break
      if chosen:
        break
    assert chosen, (page["slug"], edge["id"], "No position for edge label")
    edge["label_point"] = chosen[:2]
    edge["label_box"] = chosen[2]
    placed.append(chosen[2])
  for edge in page["routed"]:
    edge["endpoint_labels"] = []
    for index, point, side, value in [(0, edge["points"][0], edge["sides"][0], edge["source_card"]), (1, edge["points"][-1], edge["sides"][1], edge["target_card"])]:
      initial = endpoint_label(point, side, value, index == 0)
      opposite = next((other for other in page["routed"] if other["source"] == edge["target"] and other["target"] == edge["source"] and len(other["points"]) == len(edge["points"]) == 2 and other["points"][0][1] == other["points"][1][1] and edge["points"][0][1] == edge["points"][1][1]), None)
      if opposite:
        label_y = point[1]-40 if edge["points"][0][1] < opposite["points"][0][1] else point[1]+15
        initial = (initial[0], label_y, initial[2], initial[3])
      chosen = None
      for shift in [0, -20, 20, -40, 40, -60, 60, -80, 80]:
        box = (initial[0], initial[1]+shift, initial[2], initial[3]) if side in ["L", "R"] else (initial[0]+shift, initial[1], initial[2], initial[3])
        if not any(overlaps(box, item) for item in obstacles+placed):
          chosen = box
          break
      assert chosen, (page["slug"], edge["id"], value, "No position for cardinality")
      placed.append(chosen)
      edge["endpoint_labels"].append({"ending": "source" if index == 0 else "target", "point": point, "value": value, "box": chosen})


def render(page):
  width, height = page["size"]
  canvas = Canvas(width, height, page["title"])
  canvas.text(60, 72, page["title"], 34, kind="bold")
  canvas.text(60, 112, page["subtitle"], 17, MUTED)
  legend = [(60, "fk", "FK vật lý · PostgreSQL kiểm tra"), (600, "link", "LINK · bảng nối module, không FK"), (1140, "ref", "REF · ID / read-only, không FK")]
  for x, kind, text in legend:
    canvas.line([(x, 157), (x + 65, 157)], COLORS[kind], dash=DASHES[kind])
    canvas.text(x + 78, 163, text, 16, COLORS[kind])
  counts = Counter(BY_ID[item]["kind"] for item in page["edges"])
  canvas.text(60, 204, f"Trang này: {len(page['nodes'])} bảng · {len(page['edges'])} cạnh ({counts['fk']} FK / {counts['link']} LINK / {counts['ref']} REF)", 15, MUTED)
  canvas.text(60, 229, "? = NULL được phép · PK1/PK2 = PK ghép · UQ* = unique khi deleted_at IS NULL · idx = index thường", 15, MUTED)
  for edge in page["routed"]:
    canvas.line(edge["points"], COLORS[edge["kind"]], dash=DASHES[edge["kind"]])
  for name, (x, y) in page["nodes"].items():
    node = BY_NAME[name]
    accent, light = DOMAINS[node["domain"]]
    canvas.rect(x + 3, y + 4, WIDTH, HEIGHT, "#e2e8f0", radius=5)
    canvas.rect(x, y, WIDTH, HEIGHT, stroke="#94a3b8", radius=5)
    canvas.rect(x + 1, y + 1, WIDTH - 2, 64, light, radius=4)
    canvas.rect(x, y, 5, HEIGHT, accent, radius=2)
    canvas.text(x + 18, y + 28, node["title"], 21, accent, "bold")
    canvas.text(x + 18, y + 51, name, 13, MUTED, "mono")
    for index, item in enumerate(node["fields"]):
      label, dtype = display_field(item)
      canvas.text(x + 18, y + 94 + index * 22, label, 14, kind="mono")
      canvas.text(x + WIDTH - 17, y + 94 + index * 22, dtype, 12, MUTED, anchor="end")
    for index, note in enumerate(node["notes"]):
      canvas.text(x + 18, y + HEIGHT - 34 + index * 18, note, 12, MUTED)
  for x, y, w, h, title, lines in page["callouts"]:
    canvas.rect(x, y, w, h, "#f8fafc", "#cbd5e1", radius=5)
    canvas.text(x + 22, y + 37, title, 21, kind="bold")
    text_y = y + 75
    for line in lines:
      text_y = canvas.paragraph(x + 22, text_y, line, w - 44, 15, 24)
      text_y += 10
  for edge in page["routed"]:
    x, y = edge["label_point"]
    label_width = font(14, "bold").getlength(edge["label"]) + 16
    canvas.rect(x - label_width / 2, y - 13, label_width, 24, "white", radius=3)
    canvas.text(x, y + 5, edge["label"], 14, COLORS[edge["kind"]], "bold", "middle")
    for label in edge["endpoint_labels"]:
      value = label["value"]
      label_x, label_y, label_w, label_h = label["box"]
      canvas.rect(label_x, label_y, label_w, label_h, "white", radius=2)
      canvas.text(label_x + label_w / 2, label_y + 16, value, 14, COLORS[edge["kind"]], "bold", "middle")
  text_y = height - 183
  for line in ["Số đầu cạnh: 1 / 0..1 / 0..N. Với LINK hoặc REF, ID NOT NULL không bảo đảm bản ghi đích tồn tại.", "Với LINK, 0..N ở phía bảng nối là số bản ghi link DB có thể lưu; cardinality của API được ghi riêng.", "PK ghép chỉ ngăn trùng cặp. API Cart–Order / Cart–Payment singular không có nghĩa DB cưỡng chế 1:1. R25: 0..1* chỉ tính payment chưa xóa.", "Nguồn: catalog 24/10/2026 cho 20 bảng; Customer/Product từ snapshot v1 17/10/2026. Medusa 2.21.2. Bản vẽ: 25/10/2026.", "Cột được chọn để đọc nghiệp vụ; địa chỉ, thuế, shipping, provider và các module hỗ trợ không được vẽ đầy đủ. Chưa chạy checkout trong công việc ERD."]:
    text_y = canvas.paragraph(60, text_y, line, width - 120, 14, 21)
    text_y += 8
  canvas.save("medusa-erd-v2-" + page["slug"])


def add_cell(root, identity, value, style, x, y, width, height, **attributes):
  cell = ET.SubElement(root, "mxCell", {"id": identity, "value": value, "style": style, "vertex": "1", "parent": "1", **attributes})
  ET.SubElement(cell, "mxGeometry", {"x": str(x), "y": str(y), "width": str(width), "height": str(height), "as": "geometry"})
  return cell


def drawio(pages):
  document = ET.Element("mxfile", {"host": "app.diagrams.net", "type": "device", "compressed": "false"})
  for page in pages:
    width, height = page["size"]
    diagram = ET.SubElement(document, "diagram", {"id": "erd-v2-" + page["slug"], "name": page["name"]})
    model = ET.SubElement(diagram, "mxGraphModel", {"dx": str(width), "dy": str(height), "grid": "1", "gridSize": "20", "guides": "1", "tooltips": "1", "connect": "1", "arrows": "1", "fold": "1", "page": "1", "pageScale": "1", "pageWidth": str(width), "pageHeight": str(height), "background": "#ffffff"})
    root = ET.SubElement(model, "root")
    ET.SubElement(root, "mxCell", {"id": "0"})
    ET.SubElement(root, "mxCell", {"id": "1", "parent": "0"})
    add_cell(root, "title", html.escape(page["title"]), "text;html=1;align=left;verticalAlign=middle;fontFamily=Arial;fontSize=34;fontStyle=1;", 60, 34, width - 120, 45)
    add_cell(root, "subtitle", html.escape(page["subtitle"]), "text;html=1;align=left;fontFamily=Arial;fontSize=17;fontColor=#475569;", 60, 88, width - 120, 30)
    legend_text = "<span style='color:#2563eb'>━━ FK vật lý</span> &nbsp;&nbsp; <span style='color:#15803d'>···· LINK / bảng nối module</span> &nbsp;&nbsp; <span style='color:#b45309'>– – REF / ID hoặc read-only</span><br>? = NULL · PK1/PK2 = PK ghép · UQ* = unique active · idx = index thường"
    add_cell(root, "legend", legend_text, "text;html=1;align=left;fontFamily=Arial;fontSize=16;", 60, 138, width - 120, 82)
    for name, (x, y) in page["nodes"].items():
      node = BY_NAME[name]
      accent, light = DOMAINS[node["domain"]]
      rows = "".join("<tr><td style='font-family:Consolas;font-size:14px;padding:3px 0'>" + html.escape(display_field(item)[0]) + "</td><td style='text-align:right;font-size:12px;color:#475569'>" + html.escape(display_field(item)[1]) + "</td></tr>" for item in node["fields"])
      value = f"<div style='background:{light};padding:9px 15px'><div style='font-size:21px;font-weight:bold;color:{accent}'>{html.escape(node['title'])}</div><div style='font-family:Consolas;font-size:13px;color:#475569;margin-top:4px'>{name}</div></div><div style='padding:10px 15px'><table style='width:100%;border-collapse:collapse'>{rows}</table><div style='font-size:12px;color:#475569;margin-top:10px'>" + "<br>".join(html.escape(line) for line in node["notes"]) + "</div></div>"
      add_cell(root, "table-" + name, value, "rounded=1;arcSize=4;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacing=0;fillColor=#ffffff;strokeColor=#94a3b8;fontFamily=Arial;", x, y, WIDTH, HEIGHT)
    for edge in page["routed"]:
      sx, sy = page["nodes"][edge["source"]]
      tx, ty = page["nodes"][edge["target"]]
      first, last = edge["points"][0], edge["points"][-1]
      style = f"edgeStyle=none;rounded=0;html=1;startArrow=none;endArrow=none;strokeWidth=3;strokeColor={COLORS[edge['kind']]};fontColor={COLORS[edge['kind']]};fontSize=14;fontStyle=1;labelBackgroundColor=#ffffff;exitX={(first[0]-sx)/WIDTH};exitY={(first[1]-sy)/HEIGHT};entryX={(last[0]-tx)/WIDTH};entryY={(last[1]-ty)/HEIGHT};"
      if DASHES[edge["kind"]]:
        style += "dashed=1;dashPattern=" + " ".join(str(item) for item in DASHES[edge["kind"]]) + ";"
      cell = ET.SubElement(root, "mxCell", {"id": edge["id"], "value": edge["label"], "style": style, "edge": "1", "parent": "1", "source": "table-" + edge["source"], "target": "table-" + edge["target"]})
      lengths = [abs(a[0]-b[0]) + abs(a[1]-b[1]) for a, b in zip(edge["points"], edge["points"][1:])]
      total = sum(lengths)
      travelled = 0
      position = 0
      for (a, b), length in zip(zip(edge["points"], edge["points"][1:]), lengths):
        px, py = edge["label_point"]
        on_segment = (a[0] == b[0] == px and min(a[1], b[1]) <= py <= max(a[1], b[1])) or (a[1] == b[1] == py and min(a[0], b[0]) <= px <= max(a[0], b[0]))
        if on_segment:
          position = (travelled + abs(px-a[0])+abs(py-a[1])) / total * 2 - 1
          break
        travelled += length
      geometry = ET.SubElement(cell, "mxGeometry", {"x": str(position), "relative": "1", "as": "geometry"})
      points = ET.SubElement(geometry, "Array", {"as": "points"})
      for x, y in edge["points"][1:-1]:
        ET.SubElement(points, "mxPoint", {"x": str(x), "y": str(y)})
      for label in edge["endpoint_labels"]:
        ending, point, value = label["ending"], label["point"], label["value"]
        lx, ly, lw, lh = label["box"]
        label_cell = ET.SubElement(root, "mxCell", {"id": edge["id"] + "-" + ending, "value": value, "style": f"edgeLabel;html=1;align=center;verticalAlign=middle;fontFamily=Arial;fontSize=14;fontStyle=1;fontColor={COLORS[edge['kind']]};labelBackgroundColor=#ffffff;", "vertex": "1", "connectable": "0", "parent": edge["id"]})
        label_geometry = ET.SubElement(label_cell, "mxGeometry", {"x": "-1" if ending == "source" else "1", "relative": "1", "as": "geometry"})
        ET.SubElement(label_geometry, "mxPoint", {"x": str(lx+lw/2-point[0]), "y": str(ly+lh/2-point[1]), "as": "offset"})
    for index, (x, y, w, h, title, lines) in enumerate(page["callouts"]):
      value = "<b style='font-size:21px'>" + html.escape(title) + "</b><br><br>" + "<br><br>".join(html.escape(line) for line in lines)
      add_cell(root, f"note-{index}", value, "rounded=1;whiteSpace=wrap;html=1;align=left;verticalAlign=top;spacing=20;fillColor=#f8fafc;strokeColor=#cbd5e1;fontFamily=Arial;fontSize=15;", x, y, w, h)
    footer = "Số đầu cạnh: 1 / 0..1 / 0..N. LINK/REF không có FK; ID NOT NULL không bảo đảm bản ghi đích tồn tại.<br>Với LINK, 0..N là số bản ghi bảng nối DB có thể lưu; cardinality API ghi riêng. PK cặp không cưỡng chế 1:1. R25: unique chỉ với payment chưa xóa.<br>Nguồn: catalog 24/10/2026 cho 20 bảng; Customer/Product từ snapshot v1 17/10/2026; Medusa 2.21.2. Bản vẽ 25/10/2026.<br>Các cột chọn lọc; không thay thế schema đầy đủ. Chưa chạy checkout trong công việc ERD. Xem medusa-erd-v2-business.md."
    add_cell(root, "footer", footer, "text;html=1;whiteSpace=wrap;align=left;verticalAlign=top;fontFamily=Arial;fontSize=14;fontColor=#475569;", 60, height-183, width-120, 150)
  ET.indent(document, space="  ")
  ET.ElementTree(document).write(ROOT / "medusa-erd-v2-business.drawio", encoding="utf-8", xml_declaration=True)


def segment_crosses_rectangle(a, b, rectangle):
  x, y, w, h = rectangle
  if a[0] == b[0]:
    return x < a[0] < x+w and max(min(a[1], b[1]), y) < min(max(a[1], b[1]), y+h)
  if a[1] == b[1]:
    return y < a[1] < y+h and max(min(a[0], b[0]), x) < min(max(a[0], b[0]), x+w)
  raise AssertionError("Non-orthogonal edge")


def validate(metadata):
  assert len(TABLES) == 22
  assert len(RELATIONSHIPS) == 30
  assert Counter(item["kind"] for item in RELATIONSHIPS) == {"fk": 12, "link": 8, "ref": 10}
  assert set(item for page in PAGES[1:] for item in page["edges"]) == set(BY_ID)
  errors = []
  for edge in RELATIONSHIPS:
    columns = {item["column_name"]: item for item in metadata[edge["target"]]["columns"]}
    assert edge["target_column"] in columns, edge
    expected_card = "0..1" if columns[edge["target_column"]]["is_nullable"] == "YES" else "1"
    assert edge["source_card"] == expected_card, edge
    target = metadata[edge["target"]]
    pattern = "FOREIGN KEY (" + edge["target_column"] + ") REFERENCES " + edge["source"] + "(id)"
    actual_fk = any(pattern in item["definition"].replace('"', "") for item in target["constraints"] if item["constraint_type"] == "f")
    assert actual_fk == (edge["kind"] == "fk"), edge
  for page in PAGES:
    boxes = [edge["label_box"] for edge in page["routed"]]
    boxes += [label["box"] for edge in page["routed"] for label in edge["endpoint_labels"]]
    obstacles = [(x, y, WIDTH, HEIGHT) for x, y in page["nodes"].values()]
    obstacles += [item[:4] for item in page["callouts"]]
    assert not any(overlaps(box, obstacle) for box in boxes for obstacle in obstacles), page["slug"]
    assert not any(overlaps(box, other) for index, box in enumerate(boxes) for other in boxes[index+1:]), page["slug"]
    for edge in page["routed"]:
      for name, (x, y) in page["nodes"].items():
        for a, b in zip(edge["points"], edge["points"][1:]):
          if segment_crosses_rectangle(a, b, (x, y, WIDTH, HEIGHT)):
            errors.append({"page": page["slug"], "edge": edge["id"], "crosses_table": name})
  assert not errors, errors
  result = {"generated_on": "2026-10-25", "source_catalog": str(CATALOG.relative_to(ROOT)), "table_count": len(TABLES), "relationship_count": len(RELATIONSHIPS), "edge_kinds": dict(Counter(item["kind"] for item in RELATIONSHIPS)), "pages": [{"slug": page["slug"], "tables": len(page["nodes"]), "edges": len(page["edges"])} for page in PAGES], "checks": {"selected_fields_exist": True, "source_cardinality_matches_column_nullability": True, "all_physical_fk_edges_match_live_catalog": True, "no_link_or_reference_edge_mislabeled_as_fk": True, "three_detail_pages_cover_all_30_relationships": True, "orthogonal_routes_do_not_cross_table_interiors": True, "labels_do_not_overlap_each_other_or_tables": True}, "visual_review": "Pending visual inspection of PNG exports"}
  out = ROOT / "evidence/erd-v2-validation-2026-10-25.json"
  out.write_text(json.dumps(result, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
  return result


def main():
  metadata = load_metadata()
  for page in PAGES:
    route_page(page)
    layout_labels(page)
  result = validate(metadata)
  manifest = {"title": "Medusa ERD v2", "generated_on": "2026-10-25", "schema_source": "catalog 24/10/2026; Customer/Product v1 snapshot 17/10/2026", "tables": TABLES, "relationships": RELATIONSHIPS, "pages": PAGES}
  (ROOT / "medusa-erd-v2-graph.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
  for page in PAGES:
    render(page)
  drawio(PAGES)
  print(json.dumps({"tables": result["table_count"], "relationships": result["relationship_count"], "pages": result["pages"], "status": "Generated; visual review required"}, ensure_ascii=False))


if __name__ == "__main__":
  main()

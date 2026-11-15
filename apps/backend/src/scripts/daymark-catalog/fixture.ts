import { MedusaError } from "@medusajs/framework/utils"
import type {
  CatalogColour,
  CatalogColourCode,
  CatalogFixture,
  CatalogProduct,
  CatalogVariant,
} from "./types"

// DAYMARK-owned fixture data for the 30 product everyday-clothing assortment.
// Handles, SKUs and collection/category handles are all prefixed so that the
// importer can match its own records and never touch unrelated commerce data.
// Prices are whole Vietnamese dong and are authoritative only once written
// through Medusa workflows; this file is an input, not a price source of truth.

export const COLOURS: readonly CatalogColour[] = [
  { code: "IVR", name: "Ngà" },
  { code: "BLK", name: "Đen" },
  { code: "OLV", name: "Olive" },
  { code: "CHR", name: "Than chì" },
  { code: "NAT", name: "Mộc" },
  { code: "WHT", name: "Trắng" },
  { code: "BLU", name: "Xanh dương" },
  { code: "SKY", name: "Xanh trời" },
  { code: "NVY", name: "Xanh navy" },
  { code: "STN", name: "Xám đá" },
  { code: "OAT", name: "Yến mạch" },
  { code: "SLT", name: "Xám phiến" },
  { code: "STR", name: "Kẻ đen / ngà" },
  { code: "GRY", name: "Xám" },
] as const

export const TOP_SIZES = ["S", "M", "L", "XL"] as const
export const TROUSER_SIZES = ["28", "30", "32", "34"] as const
export const ONE_SIZE = ["TU"] as const

const products: readonly CatalogProduct[] = [
  // Daily Essentials
  {
    handle: "dm-tee-core",
    title: "Core Cotton Tee",
    description:
      "Áo thun cotton chải kỹ dày vừa, cổ tròn gọn và thân suông. Dễ phối cho những ngày học tập, làm việc và dạo phố.",
    collectionHandle: "dm-daily-essentials",
    categoryHandle: "dm-tees",
    priceVnd: 249000,
    skuPrefix: "DM-TEE-CORE",
    sizes: TOP_SIZES,
    colourCodes: ["IVR", "BLK", "OLV"],
    stockPerVariant: 24,
  },
  {
    handle: "dm-tee-heavy",
    title: "Heavyweight Cotton Tee",
    description:
      "Áo thun jersey cotton dày, tay rộng và gấu ngang tạo phom đứng, thoải mái khi mặc riêng hoặc phối lớp.",
    collectionHandle: "dm-daily-essentials",
    categoryHandle: "dm-tees",
    priceVnd: 349000,
    skuPrefix: "DM-TEE-HVY",
    sizes: TOP_SIZES,
    colourCodes: ["IVR", "CHR"],
    stockPerVariant: 18,
  },
  {
    handle: "dm-tee-pocket",
    title: "Pocket Cotton Tee",
    description: "Áo thun cotton có túi ngực, vai thả nhẹ và thân áo thoải mái cho ngày thường.",
    collectionHandle: "dm-daily-essentials",
    categoryHandle: "dm-tees",
    priceVnd: 299000,
    skuPrefix: "DM-TEE-PKT",
    sizes: TOP_SIZES,
    colourCodes: ["NAT", "OLV"],
    stockPerVariant: 18,
  },
  {
    handle: "dm-tee-longsleeve",
    title: "Long Sleeve Cotton Tee",
    description:
      "Áo thun cotton dài tay với bo tay gọn. Một lớp áo nhẹ cho sáng sớm và những ngày mát.",
    collectionHandle: "dm-daily-essentials",
    categoryHandle: "dm-tees",
    priceVnd: 399000,
    skuPrefix: "DM-TEE-LSV",
    sizes: TOP_SIZES,
    colourCodes: ["IVR", "BLK"],
    stockPerVariant: 14,
  },
  {
    handle: "dm-shirt-linen",
    title: "Everyday Linen Shirt",
    description:
      "Áo sơ mi linen giặt mềm, một túi ngực và gấu ngang. Có thể mặc ngoài hoặc sơ vin.",
    collectionHandle: "dm-daily-essentials",
    categoryHandle: "dm-shirts",
    priceVnd: 799000,
    skuPrefix: "DM-SHT-LIN",
    sizes: TOP_SIZES,
    colourCodes: ["IVR", "SKY"],
    stockPerVariant: 12,
  },
  {
    handle: "dm-shirt-oxford",
    title: "Oxford Button-Down",
    description:
      "Áo sơ mi cotton Oxford với cổ cài nút, túi ngực và gấu cong. Một lựa chọn chỉn chu cho ngày thường.",
    collectionHandle: "dm-daily-essentials",
    categoryHandle: "dm-shirts",
    priceVnd: 749000,
    skuPrefix: "DM-SHT-OXF",
    sizes: TOP_SIZES,
    colourCodes: ["WHT", "BLU"],
    stockPerVariant: 12,
  },
  {
    handle: "dm-trousers-relaxed",
    title: "Relaxed Cotton Trouser",
    description:
      "Quần cotton thân suông, phần hông rộng vừa và túi bên tiện dụng, dễ phối với sơ mi hoặc áo thun.",
    collectionHandle: "dm-daily-essentials",
    categoryHandle: "dm-trousers",
    priceVnd: 699000,
    skuPrefix: "DM-TRS-RLX",
    sizes: TROUSER_SIZES,
    colourCodes: ["STN", "BLK"],
    stockPerVariant: 10,
  },
  {
    handle: "dm-trousers-crop",
    title: "Cropped Utility Trouser",
    description:
      "Quần cotton dài trên mắt cá chân, phom thoải mái và các chi tiết túi lấy cảm hứng từ trang phục lao động.",
    collectionHandle: "dm-daily-essentials",
    categoryHandle: "dm-trousers",
    priceVnd: 759000,
    skuPrefix: "DM-TRS-CRP",
    sizes: TROUSER_SIZES,
    colourCodes: ["OLV", "CHR"],
    stockPerVariant: 10,
  },
  {
    handle: "dm-trousers-jersey",
    title: "Jersey Relax Trouser",
    description:
      "Quần jersey mềm với lưng co giãn và dây rút, dành cho những ngày cần sự thoải mái.",
    collectionHandle: "dm-daily-essentials",
    categoryHandle: "dm-trousers",
    priceVnd: 649000,
    skuPrefix: "DM-TRS-JRS",
    sizes: TROUSER_SIZES,
    colourCodes: ["CHR", "OLV"],
    stockPerVariant: 10,
  },
  {
    handle: "dm-knit-crew",
    title: "Cotton Crew Knit",
    description:
      "Áo dệt kim cotton cổ tròn, bo tay và gấu gọn, dễ mặc riêng hoặc phối bên ngoài sơ mi.",
    collectionHandle: "dm-daily-essentials",
    categoryHandle: "dm-knitwear",
    priceVnd: 899000,
    skuPrefix: "DM-KNT-CRW",
    sizes: TOP_SIZES,
    colourCodes: ["OAT", "CHR"],
    stockPerVariant: 9,
  },
  {
    handle: "dm-bag-canvas",
    title: "Canvas Day Tote",
    description:
      "Túi canvas cotton đơn giản, quai đeo vai và ngăn đựng đồ dùng cho ngày học tập, làm việc.",
    collectionHandle: "dm-daily-essentials",
    categoryHandle: "dm-bags",
    priceVnd: 399000,
    skuPrefix: "DM-BAG-DAY",
    sizes: ONE_SIZE,
    colourCodes: ["NAT", "BLK"],
    stockPerVariant: 16,
  },
  {
    handle: "dm-bag-crossbody",
    title: "Everyday Crossbody",
    description:
      "Túi đeo chéo canvas nhỏ gọn với dây điều chỉnh và khoá kéo, giữ những vật dụng cần thiết bên bạn.",
    collectionHandle: "dm-daily-essentials",
    categoryHandle: "dm-bags",
    priceVnd: 559000,
    skuPrefix: "DM-BAG-XBD",
    sizes: ONE_SIZE,
    colourCodes: ["CHR", "BLK"],
    stockPerVariant: 12,
  },

  // Workday
  {
    handle: "dm-shirt-poplin",
    title: "Poplin Work Shirt",
    description:
      "Áo sơ mi poplin cotton với cổ áo gọn và thân suông, phù hợp ngày làm việc và những buổi hẹn.",
    collectionHandle: "dm-workday",
    categoryHandle: "dm-shirts",
    priceVnd: 849000,
    skuPrefix: "DM-SHT-POP",
    sizes: TOP_SIZES,
    colourCodes: ["WHT", "NVY"],
    stockPerVariant: 12,
  },
  {
    handle: "dm-shirt-camp",
    title: "Camp Collar Shirt",
    description:
      "Áo sơ mi cổ mở, tay ngắn và gấu ngang, tạo cảm giác thoải mái khi mặc cùng quần suông.",
    collectionHandle: "dm-workday",
    categoryHandle: "dm-shirts",
    priceVnd: 799000,
    skuPrefix: "DM-SHT-CMP",
    sizes: TOP_SIZES,
    colourCodes: ["SLT", "OLV"],
    stockPerVariant: 12,
  },
  {
    handle: "dm-shirt-stripe",
    title: "Stripe Poplin Shirt",
    description:
      "Áo sơ mi poplin kẻ sọc, cổ mềm và phom suông, thêm điểm nhấn nhẹ cho tủ đồ thường ngày.",
    collectionHandle: "dm-workday",
    categoryHandle: "dm-shirts",
    priceVnd: 849000,
    skuPrefix: "DM-SHT-STR",
    sizes: TOP_SIZES,
    colourCodes: ["STR", "BLU"],
    stockPerVariant: 10,
  },
  {
    handle: "dm-trousers-pleated",
    title: "Pleated Wool Trouser",
    description:
      "Quần vải phối len với ly trước, lưng gọn và ống suông, tạo đường nét chỉn chu mà thoải mái.",
    collectionHandle: "dm-workday",
    categoryHandle: "dm-trousers",
    priceVnd: 1190000,
    skuPrefix: "DM-TRS-PLT",
    sizes: TROUSER_SIZES,
    colourCodes: ["CHR", "NVY"],
    stockPerVariant: 8,
  },
  {
    handle: "dm-trousers-tapered",
    title: "Tapered Twill Trouser",
    description:
      "Quần vải twill cotton với phần hông thoải mái và ống thuôn nhẹ, dễ phối cho ngày làm việc.",
    collectionHandle: "dm-workday",
    categoryHandle: "dm-trousers",
    priceVnd: 899000,
    skuPrefix: "DM-TRS-TPR",
    sizes: TROUSER_SIZES,
    colourCodes: ["BLK", "STN"],
    stockPerVariant: 10,
  },
  {
    handle: "dm-trousers-wide",
    title: "Wide Leg Trouser",
    description:
      "Quần ống rộng với đường ly trước và lưng gọn, linh hoạt khi phối áo thun, sơ mi hoặc áo khoác.",
    collectionHandle: "dm-workday",
    categoryHandle: "dm-trousers",
    priceVnd: 949000,
    skuPrefix: "DM-TRS-WDE",
    sizes: TROUSER_SIZES,
    colourCodes: ["CHR", "OLV"],
    stockPerVariant: 8,
  },
  {
    handle: "dm-outer-blazer",
    title: "Soft Wool Blazer",
    description:
      "Áo blazer phối len phom mềm, cấu trúc nhẹ, hai túi trước và hàng nút gọn cho ngày công sở.",
    collectionHandle: "dm-workday",
    categoryHandle: "dm-outerwear",
    priceVnd: 1290000,
    skuPrefix: "DM-OUT-BLZ",
    sizes: TOP_SIZES,
    colourCodes: ["CHR", "NVY"],
    stockPerVariant: 6,
  },
  {
    handle: "dm-outer-overshirt",
    title: "Cotton Overshirt",
    description:
      "Áo khoác sơ mi cotton với túi ngực và phom rộng vừa, mặc mở bên ngoài áo thun hoặc cài nút.",
    collectionHandle: "dm-workday",
    categoryHandle: "dm-outerwear",
    priceVnd: 949000,
    skuPrefix: "DM-OUT-OVS",
    sizes: TOP_SIZES,
    colourCodes: ["OLV", "STN"],
    stockPerVariant: 9,
  },
  {
    handle: "dm-outer-trench",
    title: "Light Trench Coat",
    description:
      "Áo khoác trench nhẹ với cổ gập, hàng nút trước và dây thắt lưng, phù hợp phối lớp vào ngày mát.",
    collectionHandle: "dm-workday",
    categoryHandle: "dm-outerwear",
    priceVnd: 1250000,
    skuPrefix: "DM-OUT-TRN",
    sizes: TOP_SIZES,
    colourCodes: ["STN", "BLK"],
    stockPerVariant: 5,
  },
  {
    handle: "dm-knit-polo",
    title: "Knit Polo",
    description:
      "Áo polo dệt kim cotton, cổ áo mềm và tay bo gọn, cân bằng giữa thoải mái và chỉn chu.",
    collectionHandle: "dm-workday",
    categoryHandle: "dm-knitwear",
    priceVnd: 899000,
    skuPrefix: "DM-KNT-PLO",
    sizes: TOP_SIZES,
    colourCodes: ["OAT", "NVY"],
    stockPerVariant: 9,
  },

  // Off Hours
  {
    handle: "dm-tee-boxy",
    title: "Boxy Fit Tee",
    description:
      "Áo thun cotton phom vuông, vai rộng và thân ngắn vừa, dành cho nhịp sống cuối tuần.",
    collectionHandle: "dm-off-hours",
    categoryHandle: "dm-tees",
    priceVnd: 299000,
    skuPrefix: "DM-TEE-BXY",
    sizes: TOP_SIZES,
    colourCodes: ["OLV", "CHR", "IVR"],
    stockPerVariant: 16,
  },
  {
    handle: "dm-tee-rugby",
    title: "Rugby Stripe Tee",
    description:
      "Áo thun cotton kẻ ngang, cổ tròn và phom thoải mái. Dễ mặc cùng quần jeans hoặc quần suông.",
    collectionHandle: "dm-off-hours",
    categoryHandle: "dm-tees",
    priceVnd: 449000,
    skuPrefix: "DM-TEE-RGB",
    sizes: TOP_SIZES,
    colourCodes: ["STR", "OLV"],
    stockPerVariant: 12,
  },
  {
    handle: "dm-outer-hoodie",
    title: "Brushed Fleece Hoodie",
    description:
      "Áo hoodie nỉ chải mềm với mũ hai lớp và túi trước, giữ ấm nhẹ trong những ngày mát.",
    collectionHandle: "dm-off-hours",
    categoryHandle: "dm-outerwear",
    priceVnd: 799000,
    skuPrefix: "DM-OUT-HOD",
    sizes: TOP_SIZES,
    colourCodes: ["GRY", "BLK"],
    stockPerVariant: 10,
  },
  {
    handle: "dm-outer-coach",
    title: "Light Coach Jacket",
    description: "Áo khoác coach không lót, vải cotton pha nylon, nút bấm, bo tay và hai túi xéo.",
    collectionHandle: "dm-off-hours",
    categoryHandle: "dm-outerwear",
    priceVnd: 949000,
    skuPrefix: "DM-OUT-CCH",
    sizes: TOP_SIZES,
    colourCodes: ["OLV", "BLK"],
    stockPerVariant: 7,
  },
  {
    handle: "dm-knit-cardigan",
    title: "Ribbed Cardigan",
    description:
      "Áo cardigan cotton dệt gân, năm nút trước và túi lớn. Có thể mặc mở bên ngoài áo thun.",
    collectionHandle: "dm-off-hours",
    categoryHandle: "dm-knitwear",
    priceVnd: 1090000,
    skuPrefix: "DM-KNT-CDG",
    sizes: TOP_SIZES,
    colourCodes: ["OAT", "CHR"],
    stockPerVariant: 6,
  },
  {
    handle: "dm-trousers-cargo",
    title: "Washed Cargo Trouser",
    description:
      "Quần cargo cotton giặt mềm với túi hộp hai bên, dây rút gấu và phần hông thoải mái.",
    collectionHandle: "dm-off-hours",
    categoryHandle: "dm-trousers",
    priceVnd: 849000,
    skuPrefix: "DM-TRS-CRG",
    sizes: TROUSER_SIZES,
    colourCodes: ["OLV", "STN"],
    stockPerVariant: 8,
  },
  {
    handle: "dm-bag-weekend",
    title: "Weekend Holdall",
    description:
      "Túi canvas cotton dáng chữ nhật, khoá kéo dài, hai quai xách và dây đeo vai tháo rời.",
    collectionHandle: "dm-off-hours",
    categoryHandle: "dm-bags",
    priceVnd: 1090000,
    skuPrefix: "DM-BAG-WKD",
    sizes: ONE_SIZE,
    colourCodes: ["NAT", "CHR"],
    stockPerVariant: 5,
  },
  {
    handle: "dm-outer-vest",
    title: "Quilted Liner Vest",
    description:
      "Áo gile chần nhẹ với nút bấm và hai túi viền, dễ phối dưới áo khoác hoặc bên ngoài hoodie.",
    collectionHandle: "dm-off-hours",
    categoryHandle: "dm-outerwear",
    priceVnd: 999000,
    skuPrefix: "DM-OUT-VST",
    sizes: TOP_SIZES,
    colourCodes: ["OLV", "BLK"],
    stockPerVariant: 6,
  },
] as const

export const DAYMARK_CATALOG_FIXTURE: CatalogFixture = {
  version: 1,
  currencyCode: "vnd",
  collections: [
    {
      handle: "dm-daily-essentials",
      title: "Daily Essentials",
      description: "Plain tees, easy trousers and the pieces worn most often.",
    },
    {
      handle: "dm-workday",
      title: "Workday",
      description: "Shirts, tailored trousers and light layers for office days.",
    },
    {
      handle: "dm-off-hours",
      title: "Off Hours",
      description: "Relaxed tees, fleece, cargo trousers and bags for weekends.",
    },
  ],
  categories: [
    {
      handle: "dm-tees",
      name: "Áo thun",
      description: "Cotton jersey tees in short and long sleeve.",
    },
    {
      handle: "dm-shirts",
      name: "Áo sơ mi",
      description: "Button-through shirts in cotton, linen and poplin.",
    },
    {
      handle: "dm-trousers",
      name: "Quần",
      description: "Cotton, wool-blend and jersey trousers.",
    },
    {
      handle: "dm-outerwear",
      name: "Áo khoác",
      description: "Blazers, overshirts, coats and light jackets.",
    },
    {
      handle: "dm-knitwear",
      name: "Đồ dệt kim",
      description: "Cotton knits, polos and cardigans.",
    },
    { handle: "dm-bags", name: "Túi xách", description: "Cotton canvas carry pieces." },
  ],
  colours: COLOURS,
  products,
}

export function findColour(fixture: CatalogFixture, code: CatalogColourCode): CatalogColour {
  const colour = fixture.colours.find((entry) => entry.code === code)
  if (!colour) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Unknown colour code ${code} in the DAYMARK catalog fixture`,
    )
  }
  return colour
}

/**
 * Deterministic size/colour matrix for one product. The importer and the tests
 * both read variants from here so SKUs cannot drift from the fixture.
 */
export function buildProductVariants(
  fixture: CatalogFixture,
  product: CatalogProduct,
): CatalogVariant[] {
  const variants: CatalogVariant[] = []
  for (const colourCode of product.colourCodes) {
    const colour = findColour(fixture, colourCode)
    for (const size of product.sizes) {
      variants.push({
        sku: `${product.skuPrefix}-${colourCode}-${size}`,
        size,
        colourCode,
        colourName: colour.name,
        title: `${colour.name} / ${size}`,
      })
    }
  }
  return variants
}

export function productOptions(product: CatalogProduct): {
  title: string
  values: string[]
}[] {
  return [
    { title: "Size", values: [...product.sizes] },
    { title: "Colour", values: [...product.colourCodes] },
  ]
}

export function allFixtureVariants(fixture: CatalogFixture): {
  product: CatalogProduct
  variant: CatalogVariant
}[] {
  return fixture.products.flatMap((product) =>
    buildProductVariants(fixture, product).map((variant) => ({ product, variant })),
  )
}

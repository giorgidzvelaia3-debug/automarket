import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// ─── Categories ──────────────────────────────────────────────────────────────

const categories = [
  { name: "ძრავი", nameEn: "Engine", slug: "engine" },
  { name: "სამუხრუჭე სისტემა", nameEn: "Brakes", slug: "brakes" },
  { name: "საბურავები", nameEn: "Tires", slug: "tires" },
  { name: "ზეთები და სითხეები", nameEn: "Oils & Fluids", slug: "oils-and-fluids" },
  { name: "ელექტრო სისტემა", nameEn: "Electrical", slug: "electrical" },
  { name: "საკიდარი სისტემა", nameEn: "Suspension", slug: "suspension" },
  { name: "კუზოვი", nameEn: "Body Parts", slug: "body-parts" },
  { name: "გაგრილების სისტემა", nameEn: "Cooling System", slug: "cooling-system" },
  { name: "გადაცემათა კოლოფი", nameEn: "Transmission", slug: "transmission" },
  { name: "გამონაბოლქვი სისტემა", nameEn: "Exhaust System", slug: "exhaust-system" },
]

// ─── Vendors ─────────────────────────────────────────────────────────────────

const vendors = [
  {
    email: "info@tbilisiauto.ge",
    name: "თბილისი ავტო პარტსი",
    slug: "tbilisi-auto-parts",
    description: "თბილისში უდიდესი ავტონაწილების მაღაზია. ორიგინალური და ხარისხიანი ნაწილები ყველა მარკისთვის.",
  },
  {
    email: "info@kavkasiamotors.ge",
    name: "კავკასია მოტორსი",
    slug: "kavkasia-motors",
    description: "კავკასიის რეგიონში წამყვანი ავტონაწილების მომწოდებელი. 10 წლიანი გამოცდილება.",
  },
  {
    email: "info@autoworld.ge",
    name: "ავტო სამყარო",
    slug: "auto-world",
    description: "პრემიუმ ავტონაწილები იაპონური, გერმანული და კორეული ავტომობილებისთვის.",
  },
  {
    email: "info@mtskheta-parts.ge",
    name: "მცხეთა ნაწილები",
    slug: "mtskheta-parts",
    description: "ავტონაწილების ფართო ასორტიმენტი მისაღებ ფასებში. მიწოდება მთელ საქართველოში.",
  },
  {
    email: "info@batumi-auto.ge",
    name: "ბათუმი ავტო",
    slug: "batumi-auto",
    description: "დასავლეთ საქართველოს უმსხვილესი ავტონაწილების მაღაზია. იმპორტი თურქეთიდან და ევროპიდან.",
  },
]

// ─── Products per vendor ─────────────────────────────────────────────────────

type ProductDef = {
  name: string
  nameEn: string
  slug: string
  description: string
  descriptionEn: string
  price: number
  stock: number
  categorySlug: string
}

const vendorProducts: ProductDef[][] = [
  // თბილისი ავტო პარტსი
  [
    { name: "ძრავის ზეთი 5W-30 სინთეტიკური", nameEn: "Engine Oil 5W-30 Synthetic", slug: "engine-oil-5w30-synthetic", description: "მაღალი ხარისხის სრულად სინთეტიკური ძრავის ზეთი. შესაფერისი ბენზინის და დიზელის ძრავებისთვის.", descriptionEn: "High quality fully synthetic engine oil. Suitable for petrol and diesel engines.", price: 45, stock: 80, categorySlug: "oils-and-fluids" },
    { name: "სამუხრუჭე ხუნდები წინა Toyota", nameEn: "Front Brake Pads Toyota", slug: "front-brake-pads-toyota", description: "ორიგინალური ხარისხის სამუხრუჭე ხუნდები Toyota-ს მოდელებისთვის.", descriptionEn: "OEM quality front brake pads for Toyota models.", price: 65, stock: 45, categorySlug: "brakes" },
    { name: "ჰაერის ფილტრი უნივერსალური", nameEn: "Air Filter Universal", slug: "air-filter-universal", description: "უნივერსალური ჰაერის ფილტრი სხვადასხვა მოდელის ავტომობილისთვის.", descriptionEn: "Universal air filter for various car models.", price: 25, stock: 100, categorySlug: "engine" },
    { name: "რადიატორის ანტიფრიზი -40°C", nameEn: "Radiator Antifreeze -40°C", slug: "radiator-antifreeze-40", description: "კონცენტრირებული ანტიფრიზი, დაცვა -40 გრადუსამდე.", descriptionEn: "Concentrated antifreeze, protection down to -40°C.", price: 35, stock: 60, categorySlug: "cooling-system" },
    { name: "აკუმულატორი 60Ah", nameEn: "Car Battery 60Ah", slug: "car-battery-60ah", description: "საიმედო ავტო აკუმულატორი 60Ah სიმძლავრით. 2 წლიანი გარანტია.", descriptionEn: "Reliable car battery 60Ah capacity. 2 year warranty.", price: 185, stock: 25, categorySlug: "electrical" },
    { name: "ამორტიზატორი წინა Hyundai", nameEn: "Front Shock Absorber Hyundai", slug: "front-shock-absorber-hyundai", description: "წინა ამორტიზატორი Hyundai Tucson/ix35-ისთვის.", descriptionEn: "Front shock absorber for Hyundai Tucson/ix35.", price: 120, stock: 30, categorySlug: "suspension" },
    { name: "ფარი წინა მარჯვენა BMW E90", nameEn: "Right Headlight BMW E90", slug: "right-headlight-bmw-e90", description: "წინა მარჯვენა ფარი BMW 3 სერია E90 კუზოვისთვის.", descriptionEn: "Front right headlight for BMW 3 Series E90.", price: 280, stock: 10, categorySlug: "body-parts" },
    { name: "დისტრიბუტორის ქამარი", nameEn: "Timing Belt Kit", slug: "timing-belt-kit", description: "დისტრიბუტორის ქამრის კომპლექტი როლიკებით.", descriptionEn: "Timing belt kit with tensioner and rollers.", price: 95, stock: 40, categorySlug: "engine" },
    { name: "კატალიზატორი უნივერსალური", nameEn: "Universal Catalytic Converter", slug: "universal-catalytic-converter", description: "უნივერსალური კატალიზატორი ევრო-4 სტანდარტის.", descriptionEn: "Universal catalytic converter Euro-4 standard.", price: 350, stock: 15, categorySlug: "exhaust-system" },
    { name: "გადაცემათა კოლოფის ზეთი ATF", nameEn: "Transmission Fluid ATF", slug: "transmission-fluid-atf", description: "ავტომატური გადაცემათა კოლოფის ზეთი ATF Dexron III.", descriptionEn: "Automatic transmission fluid ATF Dexron III.", price: 40, stock: 55, categorySlug: "transmission" },
  ],
  // კავკასია მოტორსი
  [
    { name: "საბურავი 205/55 R16 ზამთარი", nameEn: "Winter Tire 205/55 R16", slug: "winter-tire-205-55-r16", description: "ზამთრის საბურავი შესანიშნავი გზაჭიდებით.", descriptionEn: "Winter tire with excellent road grip.", price: 180, stock: 40, categorySlug: "tires" },
    { name: "სამუხრუჭე დისკი წინა Mercedes", nameEn: "Front Brake Disc Mercedes", slug: "front-brake-disc-mercedes", description: "ვენტილირებული სამუხრუჭე დისკი Mercedes C-Class-ისთვის.", descriptionEn: "Ventilated front brake disc for Mercedes C-Class.", price: 110, stock: 20, categorySlug: "brakes" },
    { name: "ძრავის ზეთი 10W-40 ნახევრად სინთეტიკური", nameEn: "Engine Oil 10W-40 Semi-Synthetic", slug: "engine-oil-10w40-semi", description: "ეკონომიური ნახევრად სინთეტიკური ძრავის ზეთი.", descriptionEn: "Economical semi-synthetic engine oil.", price: 32, stock: 90, categorySlug: "oils-and-fluids" },
    { name: "გენერატორი Toyota Camry", nameEn: "Alternator Toyota Camry", slug: "alternator-toyota-camry", description: "რეკონდიცირებული გენერატორი Toyota Camry 2007-2011.", descriptionEn: "Reconditioned alternator for Toyota Camry 2007-2011.", price: 220, stock: 12, categorySlug: "electrical" },
    { name: "წყლის ტუმბო VW Golf", nameEn: "Water Pump VW Golf", slug: "water-pump-vw-golf", description: "წყლის ტუმბო Volkswagen Golf V/VI-ისთვის.", descriptionEn: "Water pump for Volkswagen Golf V/VI.", price: 75, stock: 35, categorySlug: "cooling-system" },
    { name: "შარნირი მართვის Nissan", nameEn: "CV Joint Nissan", slug: "cv-joint-nissan", description: "გარე შარნირი Nissan Qashqai-სთვის.", descriptionEn: "Outer CV joint for Nissan Qashqai.", price: 85, stock: 25, categorySlug: "suspension" },
    { name: "ბამპერი წინა Kia Sportage", nameEn: "Front Bumper Kia Sportage", slug: "front-bumper-kia-sportage", description: "წინა ბამპერი Kia Sportage 2016-2020 მოდელისთვის.", descriptionEn: "Front bumper for Kia Sportage 2016-2020.", price: 380, stock: 8, categorySlug: "body-parts" },
    { name: "ტურბოკომპრესორი 1.6 HDi", nameEn: "Turbocharger 1.6 HDi", slug: "turbocharger-16-hdi", description: "ტურბოკომპრესორი Peugeot/Citroen 1.6 HDi ძრავისთვის.", descriptionEn: "Turbocharger for Peugeot/Citroen 1.6 HDi engine.", price: 650, stock: 5, categorySlug: "engine" },
    { name: "საბურავი 225/45 R17 ზაფხული", nameEn: "Summer Tire 225/45 R17", slug: "summer-tire-225-45-r17", description: "ზაფხულის საბურავი მაღალი სიჩქარისთვის.", descriptionEn: "Summer tire for high speed performance.", price: 195, stock: 30, categorySlug: "tires" },
    { name: "გამონაბოლქვის მილი უკანა", nameEn: "Rear Exhaust Pipe", slug: "rear-exhaust-pipe", description: "უკანა გამონაბოლქვის მილი უჟანგავი ფოლადის.", descriptionEn: "Rear exhaust pipe stainless steel.", price: 145, stock: 18, categorySlug: "exhaust-system" },
  ],
  // ავტო სამყარო
  [
    { name: "LED ფარები H7 კომპლექტი", nameEn: "LED Headlight Bulbs H7 Kit", slug: "led-headlight-h7-kit", description: "LED ნათურების კომპლექტი H7, 6000K თეთრი შუქი.", descriptionEn: "LED bulb kit H7, 6000K white light.", price: 55, stock: 70, categorySlug: "electrical" },
    { name: "სრული ზეთის შეცვლის კომპლექტი", nameEn: "Full Oil Change Kit", slug: "full-oil-change-kit", description: "ზეთის ფილტრი + 5ლ ზეთი + სარეცხი. ერთ კომპლექტში.", descriptionEn: "Oil filter + 5L oil + flush. Complete kit.", price: 89, stock: 50, categorySlug: "oils-and-fluids" },
    { name: "სამუხრუჭე ხუნდები უკანა Honda", nameEn: "Rear Brake Pads Honda", slug: "rear-brake-pads-honda", description: "უკანა სამუხრუჭე ხუნდები Honda Civic/Accord-ისთვის.", descriptionEn: "Rear brake pads for Honda Civic/Accord.", price: 48, stock: 55, categorySlug: "brakes" },
    { name: "რადიატორი Honda CR-V", nameEn: "Radiator Honda CR-V", slug: "radiator-honda-crv", description: "ალუმინის რადიატორი Honda CR-V III-IV თაობისთვის.", descriptionEn: "Aluminum radiator for Honda CR-V Gen III-IV.", price: 210, stock: 14, categorySlug: "cooling-system" },
    { name: "საბურავი 195/65 R15 ყველა სეზონი", nameEn: "All Season Tire 195/65 R15", slug: "all-season-tire-195-65-r15", description: "ყველა სეზონის საბურავი ეკონომიური ფასით.", descriptionEn: "All season tire at economical price.", price: 120, stock: 60, categorySlug: "tires" },
    { name: "კოჭის საკისარი წინა Subaru", nameEn: "Front Wheel Bearing Subaru", slug: "front-wheel-bearing-subaru", description: "წინა კოჭის საკისარი Subaru Forester/Impreza.", descriptionEn: "Front wheel bearing for Subaru Forester/Impreza.", price: 65, stock: 28, categorySlug: "suspension" },
    { name: "სარკე მარცხენა ელექტრო Ford", nameEn: "Left Electric Mirror Ford", slug: "left-electric-mirror-ford", description: "მარცხენა ელექტრო სარკე Ford Focus III-ისთვის.", descriptionEn: "Left electric mirror for Ford Focus III.", price: 95, stock: 15, categorySlug: "body-parts" },
    { name: "სტარტერი Mercedes Sprinter", nameEn: "Starter Motor Mercedes Sprinter", slug: "starter-motor-sprinter", description: "სტარტერი Mercedes Sprinter 2.2 CDI ძრავისთვის.", descriptionEn: "Starter motor for Mercedes Sprinter 2.2 CDI.", price: 280, stock: 8, categorySlug: "electrical" },
    { name: "კარდანის ჯვარაკი", nameEn: "Universal Joint Cross", slug: "universal-joint-cross", description: "კარდანის ჯვარაკი გაძლიერებული.", descriptionEn: "Heavy duty universal joint cross.", price: 35, stock: 40, categorySlug: "transmission" },
    { name: "თერმოსტატი 82°C უნივერსალური", nameEn: "Thermostat 82°C Universal", slug: "thermostat-82c-universal", description: "უნივერსალური თერმოსტატი 82 გრადუსზე გახსნით.", descriptionEn: "Universal thermostat opening at 82°C.", price: 18, stock: 85, categorySlug: "cooling-system" },
  ],
  // მცხეთა ნაწილები
  [
    { name: "ზეთის ფილტრი Toyota/Lexus", nameEn: "Oil Filter Toyota/Lexus", slug: "oil-filter-toyota-lexus", description: "ორიგინალური ტიპის ზეთის ფილტრი Toyota და Lexus მოდელებისთვის.", descriptionEn: "OEM type oil filter for Toyota and Lexus models.", price: 15, stock: 100, categorySlug: "oils-and-fluids" },
    { name: "სამუხრუჭე სითხე DOT-4", nameEn: "Brake Fluid DOT-4", slug: "brake-fluid-dot4", description: "სამუხრუჭე სითხე DOT-4 სტანდარტის, 1 ლიტრი.", descriptionEn: "Brake fluid DOT-4 standard, 1 liter.", price: 22, stock: 75, categorySlug: "brakes" },
    { name: "ანთების სანთელი NGK Iridium", nameEn: "Spark Plug NGK Iridium", slug: "spark-plug-ngk-iridium", description: "ირიდიუმის ანთების სანთელი გახანგრძლივებული ვადით.", descriptionEn: "Iridium spark plug with extended lifespan.", price: 28, stock: 100, categorySlug: "engine" },
    { name: "საბურავი 175/70 R13 ბიუჯეტი", nameEn: "Budget Tire 175/70 R13", slug: "budget-tire-175-70-r13", description: "ეკონომიური საბურავი ყოველდღიური მოხმარებისთვის.", descriptionEn: "Budget tire for daily use.", price: 75, stock: 80, categorySlug: "tires" },
    { name: "ფანქარის ტიპის კოილი", nameEn: "Pencil Ignition Coil", slug: "pencil-ignition-coil", description: "ანთების კოილი (ფანქრის ტიპი) სხვადასხვა მოდელისთვის.", descriptionEn: "Pencil type ignition coil for various models.", price: 42, stock: 50, categorySlug: "electrical" },
    { name: "რულის ტიპი Toyota", nameEn: "Tie Rod End Toyota", slug: "tie-rod-end-toyota", description: "რულის ტიპი (თავი) Toyota Corolla-სთვის.", descriptionEn: "Tie rod end for Toyota Corolla.", price: 30, stock: 60, categorySlug: "suspension" },
    { name: "ბაგაჟნიკის ამორტიზატორი", nameEn: "Trunk Gas Strut", slug: "trunk-gas-strut", description: "ბაგაჟნიკის სახურავის გაზის ამორტიზატორი.", descriptionEn: "Trunk lid gas strut.", price: 20, stock: 45, categorySlug: "body-parts" },
    { name: "ვენტილატორის ქამარი", nameEn: "Fan Belt V-Ribbed", slug: "fan-belt-v-ribbed", description: "პოლიკლინოვოი ქამარი (ვენტილატორის).", descriptionEn: "Poly-V belt for accessories drive.", price: 25, stock: 70, categorySlug: "engine" },
    { name: "ანტიფრიზი მწვანე 5ლ", nameEn: "Green Antifreeze 5L", slug: "green-antifreeze-5l", description: "მზა ანტიფრიზი მწვანე, 5 ლიტრი, -35°C.", descriptionEn: "Ready-to-use green antifreeze, 5 liters, -35°C.", price: 42, stock: 40, categorySlug: "cooling-system" },
    { name: "კლაჩის კომპლექტი Opel", nameEn: "Clutch Kit Opel", slug: "clutch-kit-opel", description: "კლაჩის სრული კომპლექტი Opel Astra H 1.6-ისთვის.", descriptionEn: "Complete clutch kit for Opel Astra H 1.6.", price: 165, stock: 12, categorySlug: "transmission" },
  ],
  // ბათუმი ავტო
  [
    { name: "ძრავის ზეთი 0W-20 ჰიბრიდი", nameEn: "Engine Oil 0W-20 Hybrid", slug: "engine-oil-0w20-hybrid", description: "სპეციალური ზეთი ჰიბრიდული ავტომობილებისთვის.", descriptionEn: "Special oil for hybrid vehicles.", price: 58, stock: 45, categorySlug: "oils-and-fluids" },
    { name: "სამუხრუჭე ხუნდები კერამიკული", nameEn: "Ceramic Brake Pads Premium", slug: "ceramic-brake-pads-premium", description: "პრემიუმ კერამიკული სამუხრუჭე ხუნდები, დაბალი ხმაურით.", descriptionEn: "Premium ceramic brake pads with low noise.", price: 85, stock: 35, categorySlug: "brakes" },
    { name: "საბურავი 235/60 R18 SUV", nameEn: "SUV Tire 235/60 R18", slug: "suv-tire-235-60-r18", description: "SUV საბურავი off-road და ასფალტისთვის.", descriptionEn: "SUV tire for off-road and highway use.", price: 250, stock: 20, categorySlug: "tires" },
    { name: "ქსენონის ნათურა D2S", nameEn: "Xenon Bulb D2S", slug: "xenon-bulb-d2s", description: "ქსენონის ნათურა D2S, 4300K.", descriptionEn: "Xenon bulb D2S, 4300K.", price: 65, stock: 30, categorySlug: "electrical" },
    { name: "რადიატორის შლანგი ზედა", nameEn: "Upper Radiator Hose", slug: "upper-radiator-hose", description: "რადიატორის ზედა შლანგი უნივერსალური.", descriptionEn: "Upper radiator hose universal.", price: 28, stock: 50, categorySlug: "cooling-system" },
    { name: "პნევმო ამორტიზატორი უკანა", nameEn: "Rear Air Shock Absorber", slug: "rear-air-shock-absorber", description: "უკანა პნევმო ამორტიზატორი SUV-ებისთვის.", descriptionEn: "Rear air shock absorber for SUVs.", price: 420, stock: 6, categorySlug: "suspension" },
    { name: "კაპოტი Honda Fit", nameEn: "Hood Honda Fit", slug: "hood-honda-fit", description: "კაპოტი Honda Fit/Jazz 2014-2020.", descriptionEn: "Hood for Honda Fit/Jazz 2014-2020.", price: 320, stock: 5, categorySlug: "body-parts" },
    { name: "ბრუნის ამომრთველი Mitsubishi", nameEn: "Crankshaft Pulley Mitsubishi", slug: "crankshaft-pulley-mitsubishi", description: "ბრუნის ამომრთველი (დამპერი) Mitsubishi L200.", descriptionEn: "Crankshaft pulley damper for Mitsubishi L200.", price: 110, stock: 10, categorySlug: "engine" },
    { name: "EGR სარქველი 2.0 TDI", nameEn: "EGR Valve 2.0 TDI", slug: "egr-valve-20-tdi", description: "EGR სარქველი VW/Audi 2.0 TDI ძრავისთვის.", descriptionEn: "EGR valve for VW/Audi 2.0 TDI engine.", price: 155, stock: 15, categorySlug: "exhaust-system" },
    { name: "ავტომატის ზეთის ფილტრი", nameEn: "Automatic Transmission Filter", slug: "auto-transmission-filter", description: "ავტომატის ზეთის ფილტრი საფენით.", descriptionEn: "Automatic transmission filter with gasket.", price: 48, stock: 25, categorySlug: "transmission" },
  ],
]

// ─── Seed ────────────────────────────────────────────────────────────────────

// Category-based Unsplash images
const categoryImages: Record<string, string[]> = {
  "engine": [
    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
  ],
  "brakes": [
    "https://images.unsplash.com/photo-1600712242805-5f78671b24da?w=600",
  ],
  "tires": [
    "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600",
    "https://images.unsplash.com/photo-1621963417481-4b78e888e339?w=600",
  ],
  "oils-and-fluids": [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
  ],
  "electrical": [
    "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=600",
  ],
  "suspension": [
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600",
  ],
  "body-parts": [
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600",
  ],
  "cooling-system": [
    "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600",
  ],
  "transmission": [
    "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=600",
  ],
  "exhaust-system": [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
  ],
}

function getImagesForCategory(slug: string): string[] {
  return categoryImages[slug] ?? [
    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600",
  ]
}

async function main() {
  console.log("🌱 Seeding database...")

  // 0. Clear all product images
  const deleted = await prisma.productImage.deleteMany()
  console.log(`  ✓ Cleared ${deleted.count} old product images`)

  // 1. Admin user
  const adminPassword = await bcrypt.hash("admin123", 12)
  await prisma.user.upsert({
    where: { email: "admin@automarket.ge" },
    update: {},
    create: {
      email: "admin@automarket.ge",
      name: "Admin",
      password: adminPassword,
      role: "ADMIN",
    },
  })
  console.log("  ✓ Admin user")

  // 2. Buyer user
  const buyerPassword = await bcrypt.hash("buyer123", 12)
  await prisma.user.upsert({
    where: { email: "buyer@automarket.ge" },
    update: {},
    create: {
      email: "buyer@automarket.ge",
      name: "Test Buyer",
      password: buyerPassword,
      role: "BUYER",
    },
  })
  console.log("  ✓ Buyer user")

  // 3. Categories
  const categoryMap = new Map<string, string>()
  for (const cat of categories) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, nameEn: cat.nameEn },
      create: cat,
    })
    categoryMap.set(cat.slug, record.id)
  }
  console.log(`  ✓ ${categories.length} categories`)

  // 4. Vendors + Products
  const vendorPassword = await bcrypt.hash("vendor123", 12)

  for (let vi = 0; vi < vendors.length; vi++) {
    const v = vendors[vi]

    const user = await prisma.user.upsert({
      where: { email: v.email },
      update: {},
      create: {
        email: v.email,
        name: v.name,
        password: vendorPassword,
        role: "VENDOR",
      },
    })

    const vendor = await prisma.vendor.upsert({
      where: { slug: v.slug },
      update: { name: v.name, description: v.description, status: "APPROVED" },
      create: {
        userId: user.id,
        name: v.name,
        slug: v.slug,
        description: v.description,
        status: "APPROVED",
      },
    })

    // Products
    const products = vendorProducts[vi]
    for (const p of products) {
      const categoryId = categoryMap.get(p.categorySlug)
      if (!categoryId) {
        console.warn(`  ⚠ Category not found: ${p.categorySlug}`)
        continue
      }

      const product = await prisma.product.upsert({
        where: { slug: p.slug },
        update: {
          name: p.name,
          nameEn: p.nameEn,
          description: p.description,
          descriptionEn: p.descriptionEn,
          price: p.price,
          stock: p.stock,
          status: "ACTIVE",
        },
        create: {
          vendorId: vendor.id,
          categoryId,
          name: p.name,
          nameEn: p.nameEn,
          slug: p.slug,
          description: p.description,
          descriptionEn: p.descriptionEn,
          price: p.price,
          stock: p.stock,
          status: "ACTIVE",
        },
      })

      // Replace images — delete old ones and insert category-based Unsplash images
      await prisma.productImage.deleteMany({ where: { productId: product.id } })
      const images = getImagesForCategory(p.categorySlug)
      for (let imgIdx = 0; imgIdx < images.length; imgIdx++) {
        await prisma.productImage.create({
          data: {
            productId: product.id,
            url: images[imgIdx],
            order: imgIdx,
          },
        })
      }
    }

    console.log(`  ✓ Vendor "${v.name}" — ${products.length} products`)
  }

  console.log("\n✅ Seed complete!")
  console.log("\n📋 Test accounts:")
  console.log("   Admin:  admin@automarket.ge / admin123")
  console.log("   Buyer:  buyer@automarket.ge / buyer123")
  console.log("   Vendor: info@tbilisiauto.ge / vendor123")
  console.log("           (all vendors use password: vendor123)")
}

main()
  .catch((e) => {
    console.error("Seed failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

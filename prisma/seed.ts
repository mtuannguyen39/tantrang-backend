import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const tinTuc = await prisma.category.create({
    data: {
      name: "Tin tức",
      slug: "tin-tuc",
    },
  });
  const loiChua = await prisma.category.create({
    data: { name: "Kinh Thánh", slug: "kinh-thanh" },
  });
  const tntt = await prisma.category.create({
    data: { name: "Thiếu nhi Thánh Thể", slug: "tntt" },
  });
  const namPhungVu = await prisma.category.create({
    data: { name: "Năm Phụng Vụ", slug: "nam-phung-vu" },
  });

  console.log("✅ Đã seed dữ liệu thành công!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });

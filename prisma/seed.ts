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

  const year = await prisma.liturgicalYear.create({
    data: {
      name: "Năm Phụng Vụ C - 2025",
      code: "C",
      year: 2025,
      categoryId: namPhungVu.id,
    },
  });

  await prisma.news.create({
    data: {
      title: "Thông báo lễ Chúa Nhật 14 Thường Niên năm C",
      slug: "thong-bao",
      content:
        "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,",
      thumbnail:
        "https://scontent.fsgn2-6.fna.fbcdn.net/v/t39.30808-6/481961097_1174870354339794_3605487732673648154_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeGmMG9mmTz85hVWVTkHZKtTnDXG89wCU5acNcbz3AJTlg8Squgmdffyvr6rtCiZHSU30jY8-ksZ1MJKrLeOoM4G&_nc_ohc=FMkUuu6NHYkQ7kNvwEZodTP&_nc_oc=AdlfsJZxsOFUzdEb3ipthXT0DxMEHbWWuUB4YU-yYulLbvbHn2sUrF_khTQDjj0xMeU&_nc_zt=23&_nc_ht=scontent.fsgn2-6.fna&_nc_gid=isfeAUwJrHfFXbs0IInOWw&oh=00_AfMQLXvtlLJdm64X-kpBMgfiNxvKK7wofNvZk-pQ7NkM2Q&oe=686C1586",
      categoryId: tinTuc.id,
    },
  });

  await prisma.bibleReading.create({
    data: {
      title: "Chúa Nhật 14 Thường niên C",
      slug: "chua-nhat-thuong-nien-c",
      scripture: "Lc 10, 1-9",
      content:
        "Khi ấy, Chúa chọn thêm bảy mươi hai người nữa, và sai các ông cứ từng hai người đi trước Người, đến các thành và các nơi mà chính Người sẽ tới. Người bảo các ông rằng: “Lúa chín đầy đồng mà thợ gặt thì ít; vậy các con hãy xin chủ ruộng sai thợ đến gặt lúa của Người. Các con hãy đi. Này Ta sai các con như con chiên ở giữa sói rừng. Các con đừng mang theo túi tiền, bao bị, giầy dép, và đừng chào hỏi ai dọc đường. Vào nhà nào, trước tiên các con hãy nói: Bình an cho nhà này. Nếu ở đấy có con cái sự bình an, thì sự bình an của các con sẽ đến trên người ấy. Bằng không, sự bình an lại trở về với các con. Các con ở lại trong nhà đó, ăn uống những thứ họ có, vì thợ đáng được trả công. Các con đừng đi nhà này sang nhà nọ.   Khi vào thành nào mà người ta tiếp các con, các con hãy ăn những thức người ta dọn cho. Hãy chữa các bệnh nhân trong thành và nói với họ rằng: Nước Thiên Chúa đã đến gần các ngươi.",
      date: new Date("2025-07-06"),
      liturgicalYearId: year.id,
      categoryId: loiChua.id,
    },
  });

  await prisma.tNTT.create({
    data: {
      title: "Ngày Khai Giảng - Trung thu",
      slug: "khai-giang",
      content:
        '❤️NHÌN LẠI NGÀY KHAI GIẢNG - VUI TRUNG THU CỦA CHÚNG MÌNH ❤️  ❤️ Chúa Nhật 15/09/2024, Đoàn TNTT Giáo xứ Tân Trang - Xứ đoàn Chúa Ba Ngôi đã dâng Thánh lễ cầu nguyện cho 1 năm học Giáo lý mới. 👉🏻 Với chủ đề năm học mới là “CHÚA ƠI, CON ĐÂY” - lời đáp mà thiếu nhi chúng con luôn sẵn sàng thưa với Chúa, sẵn sàng yêu thương và sẵn sàng chia sẻ để loan báo tình yêu mà Chúa đã dành cho chúng con. 🎉 Sau Thánh Lễ, chúng con quây quần bên nhau để tổ chức vui Trung thu - được trang trí những chiếc bánh màu sắc và những đầu lân thú vị và nhiều ý nghĩa. Có đội chia sẻ rằng "Thầy đây, đừng sợ!" là niềm tin mà chúng con gửi gắm đến đồng bào chịu ảnh hưởng bởi bão phía Bắc qua những lời cầu nguyện và giúp đỡ. ❤️ Được sáng tạo, được vui chơi, chúng con mới biết rằng Thiên Chúa yêu thương loài người đến cỡ nào. Nguyện xin Chúa luôn đồng hành với Đoàn Thiếu nhi chúng con trong năm học bổ ích này.❣ Chúng con gửi lời cảm ơn đến Cha Chánh xứ Ignace, các Souer và Thầy, quý HĐMV cùng với sự hỗ trợ từ Hội Các Bà Mẹ Công Giáo đã giúp chúng con tổ chức một ngày ý nghĩa này.',
      thumbnail:
        "https://scontent.fsgn2-6.fna.fbcdn.net/v/t39.30808-6/482247786_950105760624272_8277212700035215523_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=127cfc&_nc_eui2=AeFtnWw_S176FjVxwXf_lzh6ZooUhCLyL_ZmihSEIvIv9vwd7ft7n0ZQbqoeVQ-lq6_Nbp277_iP82VvpkTAEJTa&_nc_ohc=mGaZTT6RY2EQ7kNvwFPZuQF&_nc_oc=Adm1Hj-2xfw7yqALUpHLSlV4AxerPtHRZ1TiH_Xu19YBxWYc9OQLnQ2Prn7QDqnYjeHwz54lzpgYoQbtmaErBJo0&_nc_zt=23&_nc_ht=scontent.fsgn2-6.fna&_nc_gid=EtPEV15crLwS7oifWPqjKA&oh=00_AfMTeLbvQR61LGBWqtKLjwZ1pYb0I89bsHDZ2uW02ojCDQ&oe=686C5D6D",
      categoryId: tntt.id,
    },
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

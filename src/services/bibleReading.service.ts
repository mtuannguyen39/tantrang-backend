import prisma from "../prisma/client";

export const getAllReadings = () => {
  return prisma.bibleReading.findMany({
    include: { liturgicalYear: true },
    orderBy: { date: "asc" },
  });
};

export const createReading = (data: {
  title: string;
  slug: string;
  scripture: string;
  content: string;
  date: Date;
  liturgicalYearId: number;
  categoryId: number;
}) => {
  return prisma.bibleReading.create({ data });
};

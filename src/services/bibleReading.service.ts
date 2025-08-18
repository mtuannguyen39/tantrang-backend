import prisma from "../prisma/client";

export const getAllReadings = () => {
  return prisma.bibleReading.findMany({
    include: { liturgicalYear: true },
  });
};

export const getReadingById = (id: number) => {
  return prisma.bibleReading.findUnique({
    where: { id },
    include: { category: true },
  });
};

export const createReading = (data: {
  title: string;
  slug: string;
  scripture: string;
  reading1?: string;
  reading2?: string;
  psalm?: string;
  alleluia?: string;
  gospel: string;
  liturgicalYearId: number;
  categoryId: number;
  thumbnail: string;
}) => {
  return prisma.bibleReading.create({ data });
};
export const deleteReading = (id: number) => {
  return prisma.bibleReading.delete({ where: { id } });
};

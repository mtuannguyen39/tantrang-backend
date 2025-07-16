import prisma from "../prisma/client";

export const getAllNews = async () => {
  return prisma.news.findMany({
    orderBy: { createdAt: "desc" },
  });
};

export const getNewsById = (id: number) => {
  return prisma.news.findUnique({ where: { id }, include: { category: true } });
};

export const createNews = (data: {
  title: string;
  slug: string;
  content: string;
  thumbnail?: string;
  categoryId: number;
}) => {
  return prisma.news.create({ data });
};

export const deleteNews = (id: number) => {
  return prisma.news.delete({ where: { id } });
};

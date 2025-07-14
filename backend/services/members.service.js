import { prisma } from "../prisma/prisma.provider.js";

const obtenerMiembros = async () => {
  return await prisma.serverMember.findMany({
    include: {
      user: true,
      server: true,
      role: true,
    },
  });
};

const crearMiembro = async (data) => {
  // Check if member already exists
  const existingMember = await prisma.serverMember.findUnique({
    where: {
      userId_serverId: {
        userId: data.userId,
        serverId: data.serverId
      }
    }
  });

  if (existingMember) {
    // Update existing member's role
    return await prisma.serverMember.update({
      where: {
        id: existingMember.id
      },
      data: {
        roleId: data.roleId,
      },
      include: {
        user: true,
        server: true,
        role: true,
      }
    });
  }

  // Create new member
  return await prisma.serverMember.create({
    data: {
      userId: data.userId,
      serverId: data.serverId,
      roleId: data.roleId,
    },
    include: {
      user: true,
      server: true,
      role: true,
    }
  });
};

export default {
  obtenerMiembros,
  crearMiembro
};
import { prisma } from '../prisma/prisma.provider.js';

export default () => {
    return {
        createRole: async (req, res) => {
            const { name, serverId, color, permissions } = req.body;
            const { userId } = req.query;

            if (!name || !serverId) {
                return res.status(400).json({
                    error: 'Name and server ID are required'
                });
            }

            if (!userId) {
                return res.status(400).json({
                    error: 'User ID is required'
                });
            }

            try {
                // Verificar que el servidor existe
                const server = await prisma.server.findUnique({
                    where: { id: serverId }
                });

                if (!server) {
                    return res.status(404).json({
                        error: 'Server not found'
                    });
                }

                // Verificar permisos del usuario (debe ser owner o tener permisos de gestión)
                const isOwner = server.ownerId === userId;
                let hasPermissions = isOwner;

                if (!isOwner) {
                    const memberWithPermissions = await prisma.serverMember.findFirst({
                        where: {
                            userId: userId,
                            serverId: serverId,
                            role: {
                                ServerRolePermission: {
                                    some: {
                                        value: {
                                            in: ['MANAGE_ROLES', 'ADMINISTRATOR']
                                        }
                                    }
                                }
                            }
                        }
                    });
                    hasPermissions = !!memberWithPermissions;
                }

                if (!hasPermissions) {
                    return res.status(403).json({
                        error: 'You do not have permission to create roles in this server'
                    });
                }

                // Verificar que el nombre del rol sea único en el servidor
                const existingRole = await prisma.serverRole.findFirst({
                    where: {
                        name: name,
                        serverId: serverId
                    }
                });

                if (existingRole) {
                    return res.status(409).json({
                        error: 'A role with this name already exists in this server'
                    });
                }

                // Crear el rol
                const newRole = await prisma.serverRole.create({
                    data: {
                        name,
                        serverId,
                        color: color || null
                    }
                });

                // Agregar permisos si se proporcionaron
                if (permissions && Array.isArray(permissions) && permissions.length > 0) {
                    const permissionData = permissions.map(permission => ({
                        roleId: newRole.id,
                        value: permission
                    }));

                    await prisma.serverRolePermission.createMany({
                        data: permissionData
                    });
                }

                // Obtener el rol completo con permisos
                const roleWithPermissions = await prisma.serverRole.findUnique({
                    where: { id: newRole.id },
                    include: {
                        ServerRolePermission: true,
                        server: {
                            select: {
                                name: true
                            }
                        }
                    }
                });

                return res.status(201).json(roleWithPermissions);
            } catch (error) {
                return res.status(500).json({
                    error: 'Error creating role',
                    details: error.message
                });
            }
        },

        getRolesByServer: async (req, res) => {
            const { serverId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            if (!serverId) {
                return res.status(400).json({
                    error: 'Server ID is required'
                });
            }

            try {
                const roles = await prisma.serverRole.findMany({
                    where: {
                        serverId: serverId
                    },
                    skip: skip,
                    take: limit,
                    orderBy: {
                        createdAt: 'desc'
                    },
                    include: {
                        ServerRolePermission: true,
                        server: {
                            select: {
                                name: true
                            }
                        },
                        members: {
                            select: {
                                id: true,
                                user: {
                                    select: {
                                        username: true,
                                        avatar: true
                                    }
                                }
                            }
                        }
                    }
                });

                const totalRoles = await prisma.serverRole.count({
                    where: {
                        serverId: serverId
                    }
                });

                return res.status(200).json({
                    data: roles,
                    pagination: {
                        total: totalRoles,
                        page: page,
                        limit: limit,
                        totalPages: Math.ceil(totalRoles / limit)
                    }
                });
            } catch (error) {
                return res.status(500).json({
                    error: 'Error fetching roles',
                    details: error.message
                });
            }
        },

        getRoleById: async (req, res) => {
            const { id } = req.params;

            try {
                const role = await prisma.serverRole.findUnique({
                    where: { id },
                    include: {
                        ServerRolePermission: true,
                        server: {
                            select: {
                                name: true,
                                id: true
                            }
                        },
                        members: {
                            select: {
                                id: true,
                                user: {
                                    select: {
                                        id: true,
                                        username: true,
                                        avatar: true
                                    }
                                }
                            }
                        }
                    }
                });

                if (!role) {
                    return res.status(404).json({
                        error: 'Role not found'
                    });
                }

                return res.status(200).json(role);
            } catch (error) {
                return res.status(500).json({
                    error: 'Error fetching role',
                    details: error.message
                });
            }
        },

        updateRole: async (req, res) => {
            const { id } = req.params;
            const { name, color, permissions } = req.body;
            const { userId } = req.query;

            if (!id || !userId) {
                return res.status(400).json({
                    error: 'Role ID and User ID are required'
                });
            }

            try {
                const role = await prisma.serverRole.findUnique({
                    where: { id },
                    include: {
                        server: {
                            select: {
                                ownerId: true,
                                id: true
                            }
                        }
                    }
                });

                if (!role) {
                    return res.status(404).json({ error: 'Role not found' });
                }

                // Verificar permisos
                const isOwner = role.server.ownerId === userId;
                let hasPermissions = isOwner;

                if (!isOwner) {
                    const memberWithPermissions = await prisma.serverMember.findFirst({
                        where: {
                            userId: userId,
                            serverId: role.server.id,
                            role: {
                                ServerRolePermission: {
                                    some: {
                                        value: {
                                            in: ['MANAGE_ROLES', 'ADMINISTRATOR']
                                        }
                                    }
                                }
                            }
                        }
                    });
                    hasPermissions = !!memberWithPermissions;
                }

                if (!hasPermissions) {
                    return res.status(403).json({
                        error: 'You do not have permission to update this role'
                    });
                }

                // Verificar nombre único si se está cambiando
                if (name && name !== role.name) {
                    const existingRole = await prisma.serverRole.findFirst({
                        where: {
                            name: name,
                            serverId: role.server.id,
                            id: { not: id }
                        }
                    });

                    if (existingRole) {
                        return res.status(409).json({
                            error: 'A role with this name already exists in this server'
                        });
                    }
                }

                // Actualizar el rol
                const updatedRole = await prisma.serverRole.update({
                    where: { id },
                    data: {
                        ...(name && { name }),
                        ...(color !== undefined && { color })
                    }
                });

                // Actualizar permisos si se proporcionaron
                if (permissions && Array.isArray(permissions)) {
                    // Eliminar permisos existentes
                    await prisma.serverRolePermission.deleteMany({
                        where: { roleId: id }
                    });

                    // Agregar nuevos permisos
                    if (permissions.length > 0) {
                        const permissionData = permissions.map(permission => ({
                            roleId: id,
                            value: permission
                        }));

                        await prisma.serverRolePermission.createMany({
                            data: permissionData
                        });
                    }
                }

                // Obtener el rol actualizado con permisos
                const roleWithPermissions = await prisma.serverRole.findUnique({
                    where: { id },
                    include: {
                        ServerRolePermission: true,
                        server: {
                            select: {
                                name: true
                            }
                        }
                    }
                });

                return res.status(200).json(roleWithPermissions);
            } catch (error) {
                return res.status(500).json({
                    error: 'Error updating role',
                    details: error.message
                });
            }
        },

        deleteRole: async (req, res) => {
            const { id } = req.params;
            const { userId } = req.query;

            if (!id || !userId) {
                return res.status(400).json({
                    error: 'Role ID and User ID are required'
                });
            }

            try {
                const role = await prisma.serverRole.findUnique({
                    where: { id },
                    include: {
                        server: {
                            select: {
                                ownerId: true,
                                id: true
                            }
                        },
                        members: {
                            select: {
                                id: true
                            }
                        }
                    }
                });

                if (!role) {
                    return res.status(404).json({ error: 'Role not found' });
                }

                // Verificar permisos
                const isOwner = role.server.ownerId === userId;
                let hasPermissions = isOwner;

                if (!isOwner) {
                    const memberWithPermissions = await prisma.serverMember.findFirst({
                        where: {
                            userId: userId,
                            serverId: role.server.id,
                            role: {
                                ServerRolePermission: {
                                    some: {
                                        value: {
                                            in: ['MANAGE_ROLES', 'ADMINISTRATOR']
                                        }
                                    }
                                }
                            }
                        }
                    });
                    hasPermissions = !!memberWithPermissions;
                }

                if (!hasPermissions) {
                    return res.status(403).json({
                        error: 'You do not have permission to delete this role'
                    });
                }

                // Eliminar permisos del rol
                await prisma.serverRolePermission.deleteMany({
                    where: { roleId: id }
                });

                // Actualizar miembros que tenían este rol (establecer roleId a null)
                if (role.members.length > 0) {
                    await prisma.serverMember.updateMany({
                        where: { roleId: id },
                        data: { roleId: null }
                    });
                }

                // Eliminar el rol
                await prisma.serverRole.delete({
                    where: { id }
                });

                return res.status(200).json({
                    message: 'Role deleted successfully',
                    membersAffected: role.members.length
                });
            } catch (error) {
                return res.status(500).json({
                    error: 'Error deleting role',
                    details: error.message
                });
            }
        },

        validateRoleName: async (req, res) => {
            const { name, serverId } = req.query;
            const { excludeId } = req.query; // Para excluir un rol específico (útil en edición)

            if (!name || !serverId) {
                return res.status(400).json({
                    error: 'Name and server ID are required'
                });
            }

            try {
                const whereClause = {
                    name: name,
                    serverId: serverId
                };

                if (excludeId) {
                    whereClause.id = { not: excludeId };
                }

                const existingRole = await prisma.serverRole.findFirst({
                    where: whereClause
                });

                return res.status(200).json({
                    isUnique: !existingRole,
                    exists: !!existingRole
                });
            } catch (error) {
                return res.status(500).json({
                    error: 'Error validating role name',
                    details: error.message
                });
            }
        }
    };
};
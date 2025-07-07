import rolesService from '../services/roles.service.js';

const createRole = async (req, res, next) => {
    try {
        await rolesService().createRole(req, res);
    } catch (error) {
        next(error);
    }
};

const getRolesByServer = async (req, res, next) => {
    try {
        await rolesService().getRolesByServer(req, res);
    } catch (error) {
        next(error);
    }
};

const getRoleById = async (req, res, next) => {
    try {
        await rolesService().getRoleById(req, res);
    } catch (error) {
        next(error);
    }
};

const updateRole = async (req, res, next) => {
    try {
        await rolesService().updateRole(req, res);
    } catch (error) {
        next(error);
    }
};

const deleteRole = async (req, res, next) => {
    try {
        await rolesService().deleteRole(req, res);
    } catch (error) {
        next(error);
    }
};

const validateRoleName = async (req, res, next) => {
    try {
        await rolesService().validateRoleName(req, res);
    } catch (error) {
        next(error);
    }
};

export default {
    createRole,
    getRolesByServer,
    getRoleById,
    updateRole,
    deleteRole,
    validateRoleName
};
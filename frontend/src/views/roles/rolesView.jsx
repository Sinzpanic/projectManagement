import { useState, useEffect } from "react"
import { Loader2, Shield, Users, Plus, Edit, Trash2, Check, X, AlertCircle } from "lucide-react"
import './rolesView.css'

export default function RolesView() {
  const API_URL = process.env.REACT_APP_URLAPI
  const [roles, setRoles] = useState([])
  const [serverId, setServerId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [newRole, setNewRole] = useState({
    name: "",
    color: "#5865f2",
    permissions: []
  })

  const availablePermissions = [
    "ADMINISTRATOR",
    "MANAGE_ROLES",
    "MANAGE_CHANNELS",
    "MANAGE_MESSAGES",
    "CREATE_CHANNEL",
    "DELETE_CHANNEL",
    "SEND_MESSAGES",
    "READ_MESSAGES",
    "MENTION_EVERYONE",
    "USE_VOICE_CHAT"
  ]

  const fetchRoles = async () => {
    if (!serverId.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch(`${API_URL}/roles/server/${serverId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error("Network response was not ok")
      }

      const data = await response.json()
      setRoles(data.data)
    } catch (error) {
      console.error("Error fetching roles:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    fetchRoles()
  }

  const handleCreateRole = async (e) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem("accessToken")
      const user = JSON.parse(localStorage.getItem("user"))
      
      const response = await fetch(`${API_URL}/roles?userId=${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newRole,
          serverId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error creating role")
      }

      setNewRole({ name: "", color: "#5865f2", permissions: [] })
      setShowCreateForm(false)
      fetchRoles()
    } catch (error) {
      setError(error.message)
    }
  }

  const handleUpdateRole = async (roleId, updatedData) => {
    try {
      const token = localStorage.getItem("accessToken")
      const user = JSON.parse(localStorage.getItem("user"))
      
      const response = await fetch(`${API_URL}/roles/${roleId}?userId=${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error updating role")
      }

      setEditingRole(null)
      fetchRoles()
    } catch (error) {
      setError(error.message)
    }
  }

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este rol?")) return

    try {
      const token = localStorage.getItem("accessToken")
      const user = JSON.parse(localStorage.getItem("user"))
      
      const response = await fetch(`${API_URL}/roles/${roleId}?userId=${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error deleting role")
      }

      fetchRoles()
    } catch (error) {
      setError(error.message)
    }
  }

  const togglePermission = (permission, isNewRole = false) => {
    if (isNewRole) {
      setNewRole(prev => ({
        ...prev,
        permissions: prev.permissions.includes(permission)
          ? prev.permissions.filter(p => p !== permission)
          : [...prev.permissions, permission]
      }))
    } else if (editingRole) {
      setEditingRole(prev => ({
        ...prev,
        permissions: prev.permissions.includes(permission)
          ? prev.permissions.filter(p => p !== permission)
          : [...prev.permissions, permission]
      }))
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="roles-view-container">
      <div className="roles-view-content">
        {/* Header */}
        <div className="header-section">
          <div className="header-title-container">
            <div className="header-icon">
              <Shield className="shield-icon" />
            </div>
            <h1 className="header-text">Server Roles</h1>
          </div>
          <p className="header-subtext">Manage roles and permissions for your Discord server</p>
        </div>

        {/* Search Form */}
        <div className="search-container">
          <div className="search-header">
            <h2 className="search-title">
              <Shield className="search-icon" />
              Find Server Roles
            </h2>
            <p className="search-description">Enter a server ID to view and manage all roles</p>
          </div>
          <div className="search-form-container">
            <form onSubmit={handleSubmit} className="search-form">
              <input
                type="text"
                value={serverId}
                onChange={(e) => setServerId(e.target.value)}
                placeholder="Enter Server ID (e.g., 123456789012345678)"
                className="search-input"
              />
              <button
                type="submit"
                disabled={isLoading || !serverId.trim()}
                className={`search-button ${(isLoading || !serverId.trim()) ? 'disabled-button' : ''}`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="loading-icon" />
                    Loading...
                  </>
                ) : (
                  "Get Roles"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="error-container">
            <div className="error-content">
              <AlertCircle className="error-icon" />
              Error: {error}
            </div>
          </div>
        )}

        {/* Create Role Button */}
        {roles.length > 0 && (
          <div className="create-role-section">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="create-role-button"
            >
              <Plus className="plus-icon" />
              Create New Role
            </button>
          </div>
        )}

        {/* Create Role Form */}
        {showCreateForm && (
          <div className="create-form-container">
            <form onSubmit={handleCreateRole} className="create-form">
              <h3 className="form-title">Create New Role</h3>
              
              <div className="form-group">
                <label className="form-label">Role Name</label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input"
                  placeholder="Enter role name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role Color</label>
                <input
                  type="color"
                  value={newRole.color}
                  onChange={(e) => setNewRole(prev => ({ ...prev, color: e.target.value }))}
                  className="color-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Permissions</label>
                <div className="permissions-grid">
                  {availablePermissions.map(permission => (
                    <label key={permission} className="permission-item">
                      <input
                        type="checkbox"
                        checked={newRole.permissions.includes(permission)}
                        onChange={() => togglePermission(permission, true)}
                        className="permission-checkbox"
                      />
                      <span className="permission-name">{permission.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-button">
                  <Check className="check-icon" />
                  Create Role
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="cancel-button"
                >
                  <X className="x-icon" />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Roles Results */}
        {roles.length > 0 && (
          <div className="roles-results">
            <div className="results-header">
              <h2 className="results-title">Roles in {roles[0].server.name}</h2>
              <span className="results-count">
                {roles.length} {roles.length === 1 ? "role" : "roles"} found
              </span>
            </div>

            <div className="roles-grid">
              {roles.map((role, index) => (
                <div
                  key={role.id}
                  className="role-card"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: "fadeInUp 0.5s ease-out forwards",
                  }}
                >
                  <div className="role-content">
                    <div className="role-header">
                      <div className="role-info">
                        <div 
                          className="role-color-indicator"
                          style={{ backgroundColor: role.color || '#5865f2' }}
                        ></div>
                        <div>
                          <h3 className="role-name">{role.name}</h3>
                          <div className="role-meta">
                            <span className="role-members">
                              <Users className="users-icon" />
                              {role.members.length} members
                            </span>
                            <span className="role-date">
                              Created {formatDate(role.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="role-actions">
                        <button
                          onClick={() => setEditingRole({
                            ...role,
                            permissions: role.ServerRolePermission.map(p => p.value)
                          })}
                          className="edit-button"
                        >
                          <Edit className="edit-icon" />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className="delete-button"
                        >
                          <Trash2 className="trash-icon" />
                        </button>
                      </div>
                    </div>

                    <div className="role-permissions">
                      <h4 className="permissions-title">Permissions</h4>
                      <div className="permissions-list">
                        {role.ServerRolePermission.length > 0 ? (
                          role.ServerRolePermission.map(permission => (
                            <span key={permission.id} className="permission-tag">
                              {permission.value.replace(/_/g, ' ')}
                            </span>
                          ))
                        ) : (
                          <span className="no-permissions">No permissions assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Role Modal */}
        {editingRole && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 className="modal-title">Edit Role: {editingRole.name}</h3>
              
              <div className="form-group">
                <label className="form-label">Role Name</label>
                <input
                  type="text"
                  value={editingRole.name}
                  onChange={(e) => setEditingRole(prev => ({ ...prev, name: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role Color</label>
                <input
                  type="color"
                  value={editingRole.color || '#5865f2'}
                  onChange={(e) => setEditingRole(prev => ({ ...prev, color: e.target.value }))}
                  className="color-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Permissions</label>
                <div className="permissions-grid">
                  {availablePermissions.map(permission => (
                    <label key={permission} className="permission-item">
                      <input
                        type="checkbox"
                        checked={editingRole.permissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                        className="permission-checkbox"
                      />
                      <span className="permission-name">{permission.replace(/_/g, ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  onClick={() => handleUpdateRole(editingRole.id, {
                    name: editingRole.name,
                    color: editingRole.color,
                    permissions: editingRole.permissions
                  })}
                  className="submit-button"
                >
                  <Check className="check-icon" />
                  Save Changes
                </button>
                <button
                  onClick={() => setEditingRole(null)}
                  className="cancel-button"
                >
                  <X className="x-icon" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Results State */}
        {!isLoading && !error && serverId && roles.length === 0 && (
          <div className="no-results-container">
            <div className="no-results-content">
              <div className="no-results-inner">
                <div className="no-results-icon-container">
                  <Shield className="no-results-icon" />
                </div>
                <div>
                  <h3 className="no-results-title">No roles found</h3>
                  <p className="no-results-message">
                    No roles were found for this server ID. Please check the ID and try again.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
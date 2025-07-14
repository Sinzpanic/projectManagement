import { useState, useEffect } from "react"
import { Loader2, UserPlus, Users, Shield, Check, X, AlertCircle, Search } from "lucide-react"
import './userRolesView.css'

export default function UserRolesView() {
  const API_URL = process.env.REACT_APP_URLAPI
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [serverId, setServerId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [error, setError] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedRole, setSelectedRole] = useState("")
  const [showAssignForm, setShowAssignForm] = useState(false)

  const fetchServerData = async () => {
    if (!serverId.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem("accessToken")
      
      // Fetch roles
      const rolesResponse = await fetch(`${API_URL}/roles/server/${serverId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!rolesResponse.ok) {
        throw new Error("Error fetching roles")
      }

      const rolesData = await rolesResponse.json()
      setRoles(rolesData.data)

      // Fetch members
      const membersResponse = await fetch(`${API_URL}/members`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!membersResponse.ok) {
        throw new Error("Error fetching members")
      }

      const membersData = await membersResponse.json()
      // Filter members by server
      const serverMembers = membersData.filter(member => member.serverId === serverId)
      setUsers(serverMembers)

    } catch (error) {
      console.error("Error fetching server data:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    fetchServerData()
  }

  const handleAssignRole = async (e) => {
    e.preventDefault()
    
    if (!selectedUser || !selectedRole) {
      setError("Please select both a user and a role")
      return
    }

    setIsAssigning(true)
    setError(null)

    try {
      const token = localStorage.getItem("accessToken")
      
      const response = await fetch(`${API_URL}/members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: selectedUser.userId,
          serverId: serverId,
          roleId: selectedRole
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Error assigning role")
      }

      setSelectedUser(null)
      setSelectedRole("")
      setShowAssignForm(false)
      fetchServerData() // Refresh data
      
    } catch (error) {
      setError(error.message)
    } finally {
      setIsAssigning(false)
    }
  }

  const validateRoleAssignment = (user, roleId) => {
    // Check if user already has this role
    if (user.roleId === roleId) {
      return "User already has this role"
    }
    return null
  }

  const getRoleName = (roleId) => {
    const role = roles.find(r => r.id === roleId)
    return role ? role.name : "No role"
  }

  const getRoleColor = (roleId) => {
    const role = roles.find(r => r.id === roleId)
    return role ? role.color || '#5865f2' : '#6b7280'
  }

  return (
    <div className="user-roles-view-container">
      <div className="user-roles-view-content">
        {/* Header */}
        <div className="header-section">
          <div className="header-title-container">
            <div className="header-icon">
              <UserPlus className="user-plus-icon" />
            </div>
            <h1 className="header-text">Assign User Roles</h1>
          </div>
          <p className="header-subtext">Manage user role assignments in your Discord server</p>
        </div>

        {/* Search Form */}
        <div className="search-container">
          <div className="search-header">
            <h2 className="search-title">
              <Search className="search-icon" />
              Find Server Users
            </h2>
            <p className="search-description">Enter a server ID to view and manage user roles</p>
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
                  "Get Users"
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

        {/* Assign Role Button */}
        {users.length > 0 && roles.length > 0 && (
          <div className="assign-role-section">
            <button
              onClick={() => setShowAssignForm(!showAssignForm)}
              className="assign-role-button"
            >
              <UserPlus className="user-plus-icon" />
              Assign Role to User
            </button>
          </div>
        )}

        {/* Assign Role Form */}
        {showAssignForm && (
          <div className="assign-form-container">
            <form onSubmit={handleAssignRole} className="assign-form">
              <h3 className="form-title">Assign Role to User</h3>
              
              <div className="form-group">
                <label className="form-label">Select User</label>
                <select
                  value={selectedUser ? selectedUser.id : ""}
                  onChange={(e) => {
                    const user = users.find(u => u.id === e.target.value)
                    setSelectedUser(user)
                  }}
                  className="form-select"
                  required
                >
                  <option value="">Choose a user...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.user.username} ({user.user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Select Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="">Choose a role...</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedUser && selectedRole && (
                <div className="validation-info">
                  {validateRoleAssignment(selectedUser, selectedRole) ? (
                    <div className="validation-error">
                      <AlertCircle className="validation-icon" />
                      {validateRoleAssignment(selectedUser, selectedRole)}
                    </div>
                  ) : (
                    <div className="validation-success">
                      <Check className="validation-icon" />
                      Ready to assign role
                    </div>
                  )}
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="submit-button"
                  disabled={isAssigning || (selectedUser && selectedRole && validateRoleAssignment(selectedUser, selectedRole))}
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="loading-icon" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <Check className="check-icon" />
                      Assign Role
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignForm(false)
                    setSelectedUser(null)
                    setSelectedRole("")
                  }}
                  className="cancel-button"
                >
                  <X className="x-icon" />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users List */}
        {users.length > 0 && (
          <div className="users-results">
            <div className="results-header">
              <h2 className="results-title">Server Members</h2>
              <span className="results-count">
                {users.length} {users.length === 1 ? "member" : "members"} found
              </span>
            </div>

            <div className="users-grid">
              {users.map((member, index) => (
                <div
                  key={member.id}
                  className="user-card"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: "fadeInUp 0.5s ease-out forwards",
                  }}
                >
                  <div className="user-content">
                    <div className="user-header">
                      <div className="user-info">
                        <div className="user-avatar">
                          <Users className="avatar-icon" />
                        </div>
                        <div className="user-details">
                          <h3 className="user-name">{member.user.username}</h3>
                          <p className="user-email">{member.user.email}</p>
                          <div className="user-meta">
                            <span className="join-date">
                              Joined {new Date(member.joinedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="user-actions">
                        <button
                          onClick={() => {
                            setSelectedUser(member)
                            setShowAssignForm(true)
                          }}
                          className="assign-button"
                        >
                          <UserPlus className="assign-icon" />
                          Assign Role
                        </button>
                      </div>
                    </div>

                    <div className="user-role-info">
                      <h4 className="role-title">Current Role</h4>
                      <div className="current-role">
                        {member.roleId ? (
                          <span 
                            className="role-badge"
                            style={{ backgroundColor: getRoleColor(member.roleId) }}
                          >
                            <Shield className="role-icon" />
                            {getRoleName(member.roleId)}
                          </span>
                        ) : (
                          <span className="no-role">No role assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Roles Info */}
        {roles.length > 0 && (
          <div className="roles-info">
            <h3 className="roles-info-title">Available Roles</h3>
            <div className="roles-list">
              {roles.map(role => (
                <div key={role.id} className="role-item">
                  <div 
                    className="role-color"
                    style={{ backgroundColor: role.color || '#5865f2' }}
                  ></div>
                  <span className="role-name">{role.name}</span>
                  <span className="role-members-count">
                    {role.members.length} members
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Results State */}
        {!isLoading && !error && serverId && users.length === 0 && (
          <div className="no-results-container">
            <div className="no-results-content">
              <div className="no-results-inner">
                <div className="no-results-icon-container">
                  <Users className="no-results-icon" />
                </div>
                <div>
                  <h3 className="no-results-title">No users found</h3>
                  <p className="no-results-message">
                    No users were found for this server ID. Please check the ID and try again.
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
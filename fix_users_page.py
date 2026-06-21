with open('frontend/src/admin/pages/UsersRolesPage.tsx', 'r') as f:
    text = f.read()

new_return_block = """  return (
    <div style={{ paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Users & Roles</h2>
          <p style={{ fontSize: '0.85rem', color: '#1E293B', margin: '0.25rem 0 0 0' }}>Manage system access, assign roles, and configure permissions.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setShowInviteModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#E11D48', color: '#FFFFFF', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)' }}>
            <Plus size={16} />
            Invite User
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
        
        {/* Main Content - User List */}
        <div>
          {/* Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', backgroundColor: '#FAF6EE', padding: '1rem', borderRadius: '0.75rem', border: '2px solid #0F172A' }}>
            <div style={{ position: 'relative', width: '300px' }}>
              <Search size={16} color="#E11D48" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', backgroundColor: '#FFFFFF', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', padding: '0.5rem 1rem 0.5rem 2.25rem', fontSize: '0.85rem', fontWeight: 600, outline: 'none' }} 
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <select 
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{ backgroundColor: '#FFFFFF', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 800, outline: 'none', cursor: 'pointer' }}
              >
                <option>All Roles</option>
                <option>Super Admin</option>
                <option>Admin</option>
                <option>Interviewer</option>
                <option>Student</option>
                <option>TPO</option>
              </select>
            </div>
          </div>

          {/* User Table */}
          <div style={{ backgroundColor: '#FAF6EE', borderRadius: '0.75rem', border: '2px solid #0F172A', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#E11D48', color: '#FFFFFF', borderBottom: '2px solid #BE123C' }}>
                <tr>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: '#1E293B', fontWeight: 800 }}>Loading users...</td></tr>
                ) : users.filter(u => 
                      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) && 
                      (selectedRole === 'All Roles' || u.role === selectedRole)
                    ).map((user, idx) => (
                  <tr key={user.id} style={{ borderBottom: idx === users.length - 1 ? 'none' : '2px solid #0F172A', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.05)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#E11D48', border: '2px solid #0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: '0.85rem', fontWeight: 800 }}>
                          {(user.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>{user.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#1E293B', fontWeight: 700 }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {getRoleBadge(user.role)}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: user.status === 'Active' ? '#22C55E' : '#1E293B', fontWeight: 800 }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: user.status === 'Active' ? '#22C55E' : '#1E293B' }}></span>
                        {user.status}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right', position: 'relative' }}>
                      <button 
                        onClick={() => setActionMenuOpen(actionMenuOpen === user.id ? null : user.id)}
                        style={{ background: 'transparent', border: 'none', color: '#0F172A', cursor: 'pointer', padding: '0.4rem', borderRadius: '0.3rem', transition: 'background-color 0.2s' }}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      
                      {actionMenuOpen === user.id && (
                        <div style={{ position: 'absolute', right: '3rem', top: '1rem', backgroundColor: '#FAF6EE', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', padding: '0.5rem', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '120px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' }}>
                          <button onClick={() => { showToast('Edit User feature triggered', 'info'); setActionMenuOpen(null); }} style={{ textAlign: 'left', padding: '0.5rem', backgroundColor: 'transparent', border: 'none', color: '#0F172A', fontWeight: 800, cursor: 'pointer', borderRadius: '0.25rem', fontSize: '0.85rem' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>Edit Role</button>
                          <button onClick={() => { showToast('Permissions updated', 'success'); setActionMenuOpen(null); }} style={{ textAlign: 'left', padding: '0.5rem', backgroundColor: 'transparent', border: 'none', color: '#0F172A', fontWeight: 800, cursor: 'pointer', borderRadius: '0.25rem', fontSize: '0.85rem' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>Permissions</button>
                          <button onClick={() => { showToast('User deactivated', 'success'); setActionMenuOpen(null); }} style={{ textAlign: 'left', padding: '0.5rem', backgroundColor: 'transparent', border: 'none', color: '#EF4444', fontWeight: 800, cursor: 'pointer', borderRadius: '0.25rem', fontSize: '0.85rem' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>Deactivate</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar - Roles & Permissions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ backgroundColor: '#FAF6EE', borderRadius: '0.75rem', border: '2px solid #0F172A', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Shield size={18} color="#E11D48" />
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Permissions Overview</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { module: 'Interview Management', admin: true, tpo: true, interviewer: true },
                { module: 'Candidate Data', admin: true, tpo: true, interviewer: false },
                { module: 'System Settings', admin: true, tpo: false, interviewer: false },
              ].map((perm, i) => (
                <div key={i} style={{ borderBottom: i === 2 ? 'none' : '2px solid #0F172A', paddingBottom: i === 2 ? 0 : '1rem' }}>
                  <div style={{ fontSize: '0.85rem', color: '#0F172A', marginBottom: '0.5rem', fontWeight: 800 }}>{perm.module}</div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#1E293B', fontWeight: 700 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Admin: {perm.admin ? <Check size={12} color="#22C55E"/> : <X size={12} color="#EF4444"/>}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>TPO: {perm.tpo ? <Check size={12} color="#22C55E"/> : <X size={12} color="#EF4444"/>}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <button onClick={() => setShowPermissionsModal(true)} style={{ width: '100%', marginTop: '1.5rem', backgroundColor: 'transparent', color: '#E11D48', border: '2px solid #E11D48', borderRadius: '0.5rem', padding: '0.5rem', fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(225, 29, 72, 0.1)' }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}>
              Manage Permissions
            </button>
          </div>

        </div>

      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#FAF6EE', padding: '2rem', borderRadius: '0.75rem', border: '2px solid #0F172A', width: '400px', maxWidth: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#0F172A', margin: '0 0 1.5rem 0', fontWeight: 800 }}>Invite New User</h2>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#0F172A', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>Name</label>
              <input type="text" value={inviteForm.name} onChange={(e) => setInviteForm({...inviteForm, name: e.target.value})} style={{ width: '100%', backgroundColor: '#FFFFFF', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', padding: '0.75rem', fontWeight: 600, outline: 'none' }} placeholder="John Doe" />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#0F172A', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>Email Address</label>
              <input type="email" value={inviteForm.email} onChange={(e) => setInviteForm({...inviteForm, email: e.target.value})} style={{ width: '100%', backgroundColor: '#FFFFFF', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', padding: '0.75rem', fontWeight: 600, outline: 'none' }} placeholder="john@example.com" />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#0F172A', fontSize: '0.85rem', fontWeight: 800, marginBottom: '0.5rem' }}>Role</label>
              <select value={inviteForm.role} onChange={(e) => setInviteForm({...inviteForm, role: e.target.value})} style={{ width: '100%', backgroundColor: '#FFFFFF', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '0.5rem', padding: '0.75rem', fontWeight: 600, outline: 'none' }}>
                <option value="Admin">Admin</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Interviewer">Interviewer</option>
                <option value="TPO">TPO</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button onClick={() => setShowInviteModal(false)} style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', border: '2px solid #0F172A', color: '#0F172A', borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => {
                showToast(`Invitation sent to ${inviteForm.email}!`, 'success');
                setShowInviteModal(false);
              }} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#E11D48', color: '#FFFFFF', border: '2px solid #E11D48', borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer' }}>Send Invite</button>
            </div>
          </div>
        </div>
      )}

      {/* Manage Permissions Modal */}
      {showPermissionsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#FAF6EE', padding: '2rem', borderRadius: '0.75rem', border: '2px solid #0F172A', width: '600px', maxWidth: '90%' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#0F172A', margin: '0 0 1.5rem 0', fontWeight: 800 }}>Manage Global Permissions</h2>
            <p style={{ color: '#1E293B', fontSize: '0.9rem', fontWeight: 700, marginBottom: '2rem' }}>Adjust default access levels for each system role across major modules.</p>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', marginBottom: '2rem' }}>
              <thead style={{ backgroundColor: '#E11D48', color: '#FFFFFF', borderBottom: '2px solid #BE123C' }}>
                <tr>
                  <th style={{ padding: '1rem', textAlign: 'left', color: '#FFFFFF', fontSize: '0.8rem', fontWeight: 800 }}>Module</th>
                  <th style={{ padding: '1rem', color: '#FFFFFF', fontSize: '0.8rem', fontWeight: 800 }}>Admin</th>
                  <th style={{ padding: '1rem', color: '#FFFFFF', fontSize: '0.8rem', fontWeight: 800 }}>Interviewer</th>
                  <th style={{ padding: '1rem', color: '#FFFFFF', fontSize: '0.8rem', fontWeight: 800 }}>TPO</th>
                </tr>
              </thead>
              <tbody>
                {['Interview Management', 'Candidate Data', 'System Settings', 'Billing & Plans'].map((mod, idx) => (
                  <tr key={idx} style={{ borderBottom: '2px solid #0F172A' }}>
                    <td style={{ padding: '1rem', textAlign: 'left', color: '#0F172A', fontSize: '0.85rem', fontWeight: 800 }}>{mod}</td>
                    <td style={{ padding: '1rem' }}><input type="checkbox" defaultChecked={true} style={{ cursor: 'pointer' }} /></td>
                    <td style={{ padding: '1rem' }}><input type="checkbox" defaultChecked={idx === 0} style={{ cursor: 'pointer' }} /></td>
                    <td style={{ padding: '1rem' }}><input type="checkbox" defaultChecked={idx !== 2 && idx !== 3} style={{ cursor: 'pointer' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowPermissionsModal(false)} style={{ flex: 1, padding: '0.75rem', backgroundColor: 'transparent', border: '2px solid #0F172A', color: '#0F172A', borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => {
                showToast(`Global permissions updated successfully!`, 'success');
                setShowPermissionsModal(false);
              }} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#E11D48', color: '#FFFFFF', border: '2px solid #E11D48', borderRadius: '0.5rem', fontWeight: 800, cursor: 'pointer' }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );"""

start_idx = text.find("return (")
if start_idx != -1:
    text = text[:start_idx] + new_return_block + "\n}"

with open('frontend/src/admin/pages/UsersRolesPage.tsx', 'w') as f:
    f.write(text)

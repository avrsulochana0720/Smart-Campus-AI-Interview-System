import os

def fix_users_roles():
    path = 'frontend/src/admin/pages/UsersRolesPage.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Deactivate
    content = content.replace(
        "showToast('User deactivated', 'success'); setActionMenuOpen(null);",
        "setUsers(users.map(u => u.id === user.id ? { ...u, status: 'Inactive' } : u)); showToast('User deactivated', 'success'); setActionMenuOpen(null);"
    )
    
    # Permissions
    content = content.replace(
        "showToast('Permissions updated', 'success'); setActionMenuOpen(null);",
        "setShowPermissionsModal(true); setActionMenuOpen(null);"
    )

    # Edit Role
    content = content.replace(
        "showToast('Edit User feature triggered', 'info'); setActionMenuOpen(null);",
        "setInviteForm({ name: user.name, email: user.email, role: user.role, department: 'General' }); setShowInviteModal(true); setActionMenuOpen(null);"
    )

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

fix_users_roles()
print('UsersRolesPage fixed')

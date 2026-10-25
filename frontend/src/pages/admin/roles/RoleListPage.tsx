import React, { useEffect, useState } from 'react';
import { api } from '../../../api/client.ts';
import { useAuth } from '../../../context/AuthContext.tsx';
import { Table, Column } from '../../../components/ui/Table.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { Input } from '../../../components/ui/Input.tsx';
import { Badge } from '../../../components/ui/Badge.tsx';
import { Modal } from '../../../components/ui/Modal.tsx';
import { useToast } from '../../../components/ui/Toast.tsx';
import { usePageTitle, usePageActions } from '../../../context/PageHeaderContext.tsx';
import { Role, RolePermission } from '../../../types/index.ts';
import { ShieldPlus, Edit2, Trash2, ShieldCheck, CheckSquare, Square, RefreshCw } from 'lucide-react';

export const RoleListPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();

  usePageTitle('Roles & Permissions', [
    { label: 'Administration' },
    { label: 'Roles' },
  ]);

  const [roles, setRoles] = useState<Role[]>([]);
  const [availableModules, setAvailableModules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // Form States
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [permissionsMap, setPermissionsMap] = useState<Record<string, RolePermission>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Roles and Permissions Matrix
  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const [rolesRes, matrixRes] = await Promise.all([
        api.get<Role[]>('/roles'),
        api.get<any[]>('/roles/permissions-matrix'),
      ]);

      if (rolesRes.data) setRoles(rolesRes.data);
      if (matrixRes.data) setAvailableModules(matrixRes.data);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch roles', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');

    // Initialize all modules to false
    const initialPerms: Record<string, RolePermission> = {};
    availableModules.forEach((m) => {
      initialPerms[m.moduleKey] = {
        moduleKey: m.moduleKey,
        moduleName: m.name,
        canView: false,
        canAdd: false,
        canEdit: false,
        canDelete: false,
      };
    });
    setPermissionsMap(initialPerms);
    setIsModalOpen(true);
  };

  usePageActions([
    ...(hasPermission('roles', 'add')
      ? [
          {
            id: 'create-role',
            label: 'Create Role',
            variant: 'primary' as const,
            icon: <ShieldPlus size={14} />,
            onClick: handleOpenCreateModal,
          },
        ]
      : []),
    {
      id: 'refresh-roles',
      label: 'Refresh',
      variant: 'outline' as const,
      icon: <RefreshCw size={14} />,
      onClick: fetchRoles,
      isLoading,
    },
  ]);

  const handleOpenEditModal = async (role: Role) => {
    try {
      const res = await api.get<Role>(`/roles/${role.id}`);
      if (res.data) {
        const fullRole = res.data;
        setEditingRole(fullRole);
        setRoleName(fullRole.name);
        setRoleDescription(fullRole.description || '');

        const perms: Record<string, RolePermission> = {};
        // Fill defaults
        availableModules.forEach((m) => {
          perms[m.moduleKey] = {
            moduleKey: m.moduleKey,
            moduleName: m.name,
            canView: false,
            canAdd: false,
            canEdit: false,
            canDelete: false,
          };
        });

        // Overlay existing permissions
        fullRole.permissions?.forEach((p) => {
          perms[p.moduleKey] = {
            ...p,
            moduleName: availableModules.find((m) => m.moduleKey === p.moduleKey)?.name || p.moduleKey,
          };
        });

        setPermissionsMap(perms);
        setIsModalOpen(true);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch role details', 'error');
    }
  };

  const togglePermission = (moduleKey: string, action: 'canView' | 'canAdd' | 'canEdit' | 'canDelete') => {
    setPermissionsMap((prev) => {
      const current = prev[moduleKey] || {
        moduleKey,
        canView: false,
        canAdd: false,
        canEdit: false,
        canDelete: false,
      };

      const updated = {
        ...current,
        [action]: !current[action],
      };

      // If grant add/edit/delete, ensure view is also enabled
      if (action !== 'canView' && updated[action]) {
        updated.canView = true;
      }

      // If view is turned off, turn off add/edit/delete as well
      if (action === 'canView' && !updated.canView) {
        updated.canAdd = false;
        updated.canEdit = false;
        updated.canDelete = false;
      }

      return {
        ...prev,
        [moduleKey]: updated,
      };
    });
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) {
      showToast('Role name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    const permissions = Object.values(permissionsMap);

    try {
      if (editingRole) {
        await api.put(`/roles/${editingRole.id}`, {
          name: roleName,
          description: roleDescription,
          permissions,
        });
        showToast(`Role '${roleName}' updated successfully.`, 'success');
      } else {
        await api.post('/roles', {
          name: roleName,
          description: roleDescription,
          permissions,
        });
        showToast(`Role '${roleName}' created successfully.`, 'success');
      }

      setIsModalOpen(false);
      fetchRoles();
    } catch (err: any) {
      showToast(err.message || 'Failed to save role', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDelete = (role: Role) => {
    setEditingRole(role);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteRole = async () => {
    if (!editingRole) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/roles/${editingRole.id}`);
      showToast(`Role '${editingRole.name}' deleted.`, 'success');
      setIsDeleteModalOpen(false);
      fetchRoles();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete role', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<Role>[] = [
    {
      id: 'name',
      header: 'Role Name',
      accessorKey: 'name',
      filterType: 'text',
      sortable: true,
      cell: (r) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={r.description ? `${r.name} — ${r.description}` : r.name}
        >
          <ShieldCheck size={15} color={r.isSystem ? 'var(--brand-primary)' : 'var(--text-secondary)'} style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: '500', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {r.name}
          </span>
        </div>
      ),
    },
    {
      id: 'isSystem',
      header: 'Type',
      accessorKey: 'isSystem',
      filterType: 'select',
      filterOptions: [
        { label: 'System Core', value: 'true' },
        { label: 'Custom', value: 'false' },
      ],
      sortable: true,
      cell: (r) => (
        <Badge variant={r.isSystem ? 'info' : 'neutral'}>
          {r.isSystem ? 'System Core' : 'Custom'}
        </Badge>
      ),
    },
    {
      id: 'userCount',
      header: 'Assigned Users',
      accessorKey: 'userCount',
      filterType: 'number',
      sortable: true,
      cell: (r) => (
        <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
          {r.userCount} {r.userCount === 1 ? 'user' : 'users'}
        </span>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      filterable: false,
      sortable: false,
      cell: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          {hasPermission('roles', 'edit') && (
            <Button variant="ghost" size="sm" onClick={() => handleOpenEditModal(r)} title="Edit Permissions">
              <Edit2 size={15} />
            </Button>
          )}

          {hasPermission('roles', 'delete') && !r.isSystem && (
            <Button variant="ghost" size="sm" onClick={() => handleOpenDelete(r)} title="Delete Role">
              <Trash2 size={15} color="var(--status-danger)" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', minHeight: 0 }}>
      <Table
        columns={columns}
        data={roles}
        isLoading={isLoading}
        emptyMessage="No roles configured."
        selectable={true}
        cardRenderer={(r) => (
          <div
            style={{
              padding: '18px',
              borderRadius: 'var(--radius-card, 10px)',
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--bg-surface)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              position: 'relative',
              transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
            }}
          >
            {/* Header: Shield Icon, Role Name, Type Badge */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-sm, 6px)',
                    backgroundColor: r.isSystem ? 'rgba(0, 103, 184, 0.12)' : 'var(--bg-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: r.isSystem ? 'var(--brand-primary)' : 'var(--text-secondary)',
                    flexShrink: 0,
                  }}
                >
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-primary)' }}>{r.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{r.slug}</div>
                </div>
              </div>
              <Badge variant={r.isSystem ? 'info' : 'neutral'}>
                {r.isSystem ? 'System Core' : 'Custom'}
              </Badge>
            </div>

            {/* Description & Assigned Users */}
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', minHeight: '38px' }}>
              {r.description || 'Custom administrative and operational security role.'}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 'var(--radius-xs, 4px)',
                backgroundColor: 'var(--bg-subtle)',
                fontSize: '12px',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Assigned Membership:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {r.userCount} {r.userCount === 1 ? 'user' : 'users'}
              </span>
            </div>

            {/* Actions Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '8px',
                borderTop: '1px solid var(--border-default)',
                paddingTop: '12px',
                marginTop: '4px',
              }}
            >
              {hasPermission('roles', 'edit') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenEditModal(r)}
                  leftIcon={<Edit2 size={13} />}
                >
                  Edit Permissions
                </Button>
              )}

              {hasPermission('roles', 'delete') && !r.isSystem && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleOpenDelete(r)}
                  title="Delete Role"
                >
                  <Trash2 size={15} color="var(--status-danger)" />
                </Button>
              )}
            </div>
          </div>
        )}
      />

      {/* Role Create/Edit Modal with Permission Matrix */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRole ? `Configure Permissions: ${editingRole.name}` : 'Create Security Role'}
        description="Assign module-level granular access rights."
        maxWidth="720px"
      >
        <form onSubmit={handleSaveRole} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Role Name"
              required
              placeholder="e.g. Quality Inspector"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              disabled={editingRole?.isSystem}
            />
            <Input
              label="Description"
              placeholder="e.g. Inspects factory batches"
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-sm, 14px)',
                fontWeight: 'var(--font-weight-medium, 500)',
                color: 'var(--text-primary)',
                marginBottom: '10px',
              }}
            >
              Module Permissions Matrix
            </label>

            <div
              style={{
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'var(--border-default)',
                borderRadius: 'var(--radius-sm, 4px)',
                overflow: 'hidden',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm, 14px)' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-strong)' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: '500' }}>Module</th>
                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: '500', width: '80px' }}>View</th>
                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: '500', width: '80px' }}>Add</th>
                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: '500', width: '80px' }}>Edit</th>
                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: '500', width: '80px' }}>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {availableModules.map((mod) => {
                    const p = permissionsMap[mod.moduleKey] || {
                      canView: false,
                      canAdd: false,
                      canEdit: false,
                      canDelete: false,
                    };
                    const isAdmin = editingRole?.slug === 'admin';

                    return (
                      <tr
                        key={mod.moduleKey}
                        style={{ borderBottom: '1px solid var(--border-default)', height: '42px' }}
                      >
                        <td style={{ padding: '10px 14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                          {mod.name}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            disabled={isAdmin}
                            onClick={() => togglePermission(mod.moduleKey, 'canView')}
                            style={{ background: 'none', border: 'none', cursor: isAdmin ? 'default' : 'pointer' }}
                          >
                            {isAdmin || p.canView ? (
                              <CheckSquare size={18} color="var(--brand-primary)" />
                            ) : (
                              <Square size={18} color="var(--border-strong)" />
                            )}
                          </button>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            disabled={isAdmin}
                            onClick={() => togglePermission(mod.moduleKey, 'canAdd')}
                            style={{ background: 'none', border: 'none', cursor: isAdmin ? 'default' : 'pointer' }}
                          >
                            {isAdmin || p.canAdd ? (
                              <CheckSquare size={18} color="var(--brand-primary)" />
                            ) : (
                              <Square size={18} color="var(--border-strong)" />
                            )}
                          </button>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            disabled={isAdmin}
                            onClick={() => togglePermission(mod.moduleKey, 'canEdit')}
                            style={{ background: 'none', border: 'none', cursor: isAdmin ? 'default' : 'pointer' }}
                          >
                            {isAdmin || p.canEdit ? (
                              <CheckSquare size={18} color="var(--brand-primary)" />
                            ) : (
                              <Square size={18} color="var(--border-strong)" />
                            )}
                          </button>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            disabled={isAdmin}
                            onClick={() => togglePermission(mod.moduleKey, 'canDelete')}
                            style={{ background: 'none', border: 'none', cursor: isAdmin ? 'default' : 'pointer' }}
                          >
                            {isAdmin || p.canDelete ? (
                              <CheckSquare size={18} color="var(--brand-primary)" />
                            ) : (
                              <Square size={18} color="var(--border-strong)" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Permissions Matrix
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Role"
        description={`Are you sure you want to delete role '${editingRole?.name}'?`}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
          <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" isLoading={isSubmitting} onClick={handleDeleteRole}>
            Delete Role
          </Button>
        </div>
      </Modal>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { api } from '../../../api/client.ts';
import { useAuth } from '../../../context/AuthContext.tsx';
import { Table, Column } from '../../../components/ui/Table.tsx';
import { Button } from '../../../components/ui/Button.tsx';
import { Input } from '../../../components/ui/Input.tsx';
import { Select } from '../../../components/ui/Select.tsx';
import { Badge } from '../../../components/ui/Badge.tsx';
import { Modal } from '../../../components/ui/Modal.tsx';
import { useToast } from '../../../components/ui/Toast.tsx';
import { usePageTitle, usePageActions } from '../../../context/PageHeaderContext.tsx';
import { User, Role } from '../../../types/index.ts';
import { UserPlus, Key, Trash2, Edit2, Check, X, RefreshCw } from 'lucide-react';

export const UserListPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();

  usePageTitle('User Management', [
    { label: 'Administration' },
    { label: 'Users' },
  ]);

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPwdModalOpen, setIsResetPwdModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Add User
  const handleOpenAddModal = () => {
    setFormValues({
      username: '',
      email: '',
      fullName: '',
      password: '',
      roleId: roles[0]?.id || '',
      isActive: true,
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  usePageActions([
    ...(hasPermission('users', 'add')
      ? [
          {
            id: 'create-user',
            label: 'Create User',
            variant: 'primary' as const,
            icon: <UserPlus size={14} />,
            onClick: handleOpenAddModal,
          },
        ]
      : []),
    {
      id: 'refresh-users',
      label: 'Refresh',
      variant: 'outline' as const,
      icon: <RefreshCw size={14} />,
      onClick: () => fetchUsers(),
      isLoading,
    },
  ]);

  // Form States
  const [formValues, setFormValues] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    roleId: '',
    isActive: true,
  });

  const [resetPwdValue, setResetPwdValue] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Roles for dropdowns
  useEffect(() => {
    api.get<Role[]>('/roles').then((res) => {
      if (res.data) setRoles(res.data);
    });
  }, []);

  // Fetch Users
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      const res = await api.get<User[]>(`/users?${params.toString()}`);
      if (res.data) {
        setUsers(res.data);
        if (res.pagination) {
          setTotalCount(res.pagination.total);
          setTotalPages(res.pagination.totalPages);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch users', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, limit]);



  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formValues.username.trim()) errors.username = 'Username is required';
    if (!formValues.email.trim()) errors.email = 'Email is required';
    if (!formValues.fullName.trim()) errors.fullName = 'Full name is required';
    if (formValues.password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (!formValues.roleId) errors.roleId = 'Please select a role';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/users', formValues);
      showToast(`User '${formValues.username}' created successfully.`, 'success');
      setIsAddModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to create user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit User
  const handleOpenEditModal = (user: User) => {
    setSelectedUser(user);
    setFormValues({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      password: '',
      roleId: user.roleId,
      isActive: user.isActive,
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      await api.put(`/users/${selectedUser.id}`, {
        fullName: formValues.fullName,
        email: formValues.email,
        roleId: formValues.roleId,
        isActive: formValues.isActive,
      });
      showToast(`User '${selectedUser.username}' updated.`, 'success');
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to update user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (user: User) => {
    try {
      await api.put(`/users/${user.id}/status`, { isActive: !user.isActive });
      showToast(`Account '${user.username}' ${!user.isActive ? 'activated' : 'deactivated'}.`, 'success');
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to change status', 'error');
    }
  };

  // Admin Reset Password
  const handleOpenResetPassword = (user: User) => {
    setSelectedUser(user);
    setResetPwdValue('');
    setIsResetPwdModalOpen(true);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (resetPwdValue.length < 8) {
      showToast('Password must be at least 8 characters long', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.put(`/users/${selectedUser.id}/reset-password`, { newPassword: resetPwdValue });
      showToast(`Password for '${selectedUser.username}' has been reset.`, 'success');
      setIsResetPwdModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to reset password', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Soft Delete
  const handleOpenDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSubmit = async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/users/${selectedUser.id}`);
      showToast(`User '${selectedUser.username}' deleted.`, 'success');
      setIsDeleteModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete user', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<User>[] = [
    {
      id: 'fullName',
      header: 'User',
      accessorKey: 'fullName',
      filterType: 'text',
      sortable: true,
      cell: (u) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={`${u.fullName} (@${u.username})`}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: 'var(--brand-primary)',
              color: 'var(--brand-primary-text, #ffffff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '600',
              fontSize: '10px',
              flexShrink: 0,
            }}
          >
            {u.fullName.substring(0, 2).toUpperCase()}
          </div>
          <span
            style={{
              fontWeight: '500',
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {u.fullName}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>@{u.username}</span>
        </div>
      ),
    },
    {
      id: 'email',
      header: 'Email',
      accessorKey: 'email',
      filterType: 'text',
      sortable: true,
    },
    {
      id: 'roleName',
      header: 'Role',
      accessorKey: 'roleName',
      filterType: 'select',
      filterOptions: roles.map((r) => ({ label: r.name, value: r.name })),
      sortable: true,
      cell: (u) => <Badge variant={u.roleSlug === 'admin' ? 'info' : 'neutral'}>{u.roleName}</Badge>,
    },
    {
      id: 'isActive',
      header: 'Status',
      accessorKey: 'isActive',
      filterType: 'select',
      filterOptions: [
        { label: 'Active', value: 'true' },
        { label: 'Deactivated', value: 'false' },
      ],
      sortable: true,
      cell: (u) => (
        <Badge variant={u.isActive ? 'success' : 'danger'}>
          {u.isActive ? 'Active' : 'Deactivated'}
        </Badge>
      ),
    },
    {
      id: 'lastLoginAt',
      header: 'Last Login',
      accessorKey: 'lastLoginAt',
      filterType: 'date',
      sortable: true,
      cell: (u) => (
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
        </span>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      filterable: false,
      sortable: false,
      cell: (u) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          {hasPermission('users', 'edit') && (
            <>
              <Button
                variant="ghost"
                size="sm"
                title={u.isActive ? 'Deactivate' : 'Activate'}
                onClick={() => handleToggleStatus(u)}
              >
                {u.isActive ? <X size={15} color="var(--status-danger)" /> : <Check size={15} color="var(--status-success)" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                title="Edit Details"
                onClick={() => handleOpenEditModal(u)}
              >
                <Edit2 size={15} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                title="Reset Password"
                onClick={() => handleOpenResetPassword(u)}
              >
                <Key size={15} />
              </Button>
            </>
          )}

          {hasPermission('users', 'delete') && (
            <Button
              variant="ghost"
              size="sm"
              title="Delete User"
              onClick={() => handleOpenDelete(u)}
            >
              <Trash2 size={15} color="var(--status-danger)" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', minHeight: 0 }}>
      {/* Paginated Enterprise Data Table with Sticky Footer, Excel Filters & Card View */}
      <Table
        columns={columns}
        data={users}
        isLoading={isLoading}
        emptyMessage="No users match the specified criteria."
        selectable={true}
        pagination={{
          page,
          limit,
          total: totalCount,
          totalPages,
          onPageChange: (newPage) => setPage(newPage),
          onLimitChange: (newLimit) => {
            setLimit(newLimit);
            setPage(1);
          },
        }}
        cardRenderer={(u) => (
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
            {/* Card Header: Avatar & Status */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--brand-primary)',
                    color: 'var(--brand-primary-text, #ffffff)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600',
                    fontSize: '14px',
                    flexShrink: 0,
                  }}
                >
                  {u.fullName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-primary)' }}>{u.fullName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>@{u.username}</div>
                </div>
              </div>
              <Badge variant={u.isActive ? 'success' : 'danger'}>
                {u.isActive ? 'Active' : 'Deactivated'}
              </Badge>
            </div>

            {/* User Meta Information */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{u.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Role:</span>
                <Badge variant={u.roleSlug === 'admin' ? 'info' : 'neutral'}>{u.roleName}</Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)' }}>Last Login:</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>

            {/* Card Actions Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '6px',
                borderTop: '1px solid var(--border-default)',
                paddingTop: '12px',
                marginTop: '2px',
              }}
            >
              {hasPermission('users', 'edit') && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    title={u.isActive ? 'Deactivate' : 'Activate'}
                    onClick={() => handleToggleStatus(u)}
                  >
                    {u.isActive ? <X size={15} color="var(--status-danger)" /> : <Check size={15} color="var(--status-success)" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Edit Details"
                    onClick={() => handleOpenEditModal(u)}
                  >
                    <Edit2 size={15} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="Reset Password"
                    onClick={() => handleOpenResetPassword(u)}
                  >
                    <Key size={15} />
                  </Button>
                </>
              )}

              {hasPermission('users', 'delete') && (
                <Button
                  variant="ghost"
                  size="sm"
                  title="Delete User"
                  onClick={() => handleOpenDelete(u)}
                >
                  <Trash2 size={15} color="var(--status-danger)" />
                </Button>
              )}
            </div>
          </div>
        )}
      />

      {/* Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New User Account"
        description="Add a new operator or manager with specific role assignment."
      >
        <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Full Name"
            required
            placeholder="e.g. Michael Scott"
            value={formValues.fullName}
            onChange={(e) => setFormValues({ ...formValues, fullName: e.target.value })}
            error={formErrors.fullName}
          />
          <Input
            label="Username"
            required
            placeholder="e.g. mscott"
            value={formValues.username}
            onChange={(e) => setFormValues({ ...formValues, username: e.target.value })}
            error={formErrors.username}
          />
          <Input
            label="Email Address"
            type="email"
            required
            placeholder="e.g. mscott@factory.local"
            value={formValues.email}
            onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
            error={formErrors.email}
          />
          <Input
            label="Password"
            type="password"
            required
            placeholder="At least 8 characters"
            value={formValues.password}
            onChange={(e) => setFormValues({ ...formValues, password: e.target.value })}
            error={formErrors.password}
          />
          <Select
            label="Security Role"
            required
            value={formValues.roleId}
            onChange={(e) => setFormValues({ ...formValues, roleId: e.target.value })}
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
            error={formErrors.roleId}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit User: ${selectedUser?.username}`}
        description="Update account profile details and security role."
      >
        <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Full Name"
            required
            value={formValues.fullName}
            onChange={(e) => setFormValues({ ...formValues, fullName: e.target.value })}
          />
          <Input
            label="Email Address"
            type="email"
            required
            value={formValues.email}
            onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
          />
          <Select
            label="Security Role"
            value={formValues.roleId}
            onChange={(e) => setFormValues({ ...formValues, roleId: e.target.value })}
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Admin Reset Password Modal */}
      <Modal
        isOpen={isResetPwdModalOpen}
        onClose={() => setIsResetPwdModalOpen(false)}
        title={`Reset Password for ${selectedUser?.username}`}
        description="Assign a new temporary password for this user."
      >
        <form onSubmit={handleResetPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="New Password"
            type="password"
            required
            placeholder="At least 8 characters"
            value={resetPwdValue}
            onChange={(e) => setResetPwdValue(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <Button type="button" variant="outline" onClick={() => setIsResetPwdModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Apply New Password
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm User Deletion"
        description={`Are you sure you want to remove user account '${selectedUser?.username}'? This action performs a soft delete.`}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
          <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" isLoading={isSubmitting} onClick={handleDeleteSubmit}>
            Confirm Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

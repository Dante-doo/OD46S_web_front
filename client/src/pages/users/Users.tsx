import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import { apiService } from '../../services/apiService';
import { API_ENDPOINTS } from '../../config/api';
import Layout from '../../components/Layout/Layout';
import './Users.css';

interface User {
  id: number;
  name: string;
  email: string;
  cpf: string;
  type: string;
  active: boolean;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    password: '',
    type: 'DRIVER',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const response = await apiService.get(API_ENDPOINTS.USERS.LIST);
    if (response.success && response.data) {
      const usersData = response.data.users || response.data.data?.users || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        const response = await apiService.put(
          API_ENDPOINTS.USERS.UPDATE(editingUser.id),
          updateData
        );
        if (response.success) {
          alert('Usuário atualizado com sucesso!');
          setShowModal(false);
          resetForm();
          loadUsers();
        } else {
          alert(response.error?.message || 'Erro ao atualizar usuário');
        }
      } else {
        const response = await apiService.post(API_ENDPOINTS.USERS.CREATE, formData);
        if (response.success) {
          alert('Usuário cadastrado com sucesso!');
          setShowModal(false);
          resetForm();
          loadUsers();
        } else {
          alert(response.error?.message || 'Erro ao cadastrar usuário');
        }
      }
    } catch (error) {
      alert('Erro ao salvar usuário');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      cpf: user.cpf,
      password: '',
      type: user.type,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      const response = await apiService.delete(API_ENDPOINTS.USERS.DELETE(id));
      if (response.success) {
        alert('Usuário excluído com sucesso!');
        loadUsers();
      } else {
        alert(response.error?.message || 'Erro ao excluir usuário');
      }
    } catch (error) {
      alert('Erro ao excluir usuário');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      cpf: '',
      password: '',
      type: 'DRIVER',
    });
    setEditingUser(null);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.cpf.includes(searchTerm)
  );

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="users-page">
        <div className="page-header">
          <h2>Gerenciamento de Usuários</h2>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            <FaPlus /> Novo Usuário
          </button>
        </div>

        <div className="search-bar">
          <div className="input-group">
            <span className="input-group-text"><FaSearch /></span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nome, email ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>CPF</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td><strong>{user.name}</strong></td>
                    <td>{user.email}</td>
                    <td>{user.cpf}</td>
                    <td>
                      <span className={`badge ${user.type === 'ADMIN' ? 'bg-danger' : user.type === 'DRIVER' ? 'bg-primary' : 'bg-secondary'}`}>
                        {user.type}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${user.active ? 'bg-success' : 'bg-secondary'}`}>
                        {user.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleEdit(user)}
                          title="Editar"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(user.id)}
                          title="Excluir"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => { setShowModal(false); resetForm(); }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
                <button className="modal-close" onClick={() => { setShowModal(false); resetForm(); }}>×</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Nome *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>CPF *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      required
                      maxLength={11}
                    />
                  </div>
                  <div className="form-group">
                    <label>Senha {!editingUser && '*'}</label>
                    <input
                      type="password"
                      className="form-control"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingUser}
                      minLength={6}
                    />
                    {editingUser && <small className="text-muted">Deixe em branco para manter a senha atual</small>}
                  </div>
                  <div className="form-group">
                    <label>Tipo *</label>
                    <select
                      className="form-control"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      required
                    >
                      <option value="DRIVER">Motorista</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingUser ? 'Atualizar' : 'Cadastrar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Users;


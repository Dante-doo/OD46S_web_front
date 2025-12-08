import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaSave, FaTimes } from 'react-icons/fa';
import { apiService } from '../../services/apiService';
import { API_ENDPOINTS } from '../../config/api';
import Layout from '../../components/Layout/Layout';
import Pagination from '../../components/Pagination/Pagination';
import '../Routes/Routes.css';
import './Users.css';

interface User {
  id: number;
  name: string;
  email: string;
  cpf: string;
  type: string;
  active: boolean;
  license_number?: string;
  license_category?: string;
  license_expiry?: string;
  phone?: string;
}

interface FormDataState {
  name: string;
  email: string;
  cpf: string;
  password?: string;
  type: string;
  license_number: string;
  license_category: string;
  license_expiry: string;
  phone: string;
}


const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(20);

  const [formData, setFormData] = useState<FormDataState>({
    name: '',
    email: '',
    cpf: '',
    password: '',
    type: 'DRIVER',
    license_number: '',
    license_category: '',
    license_expiry: '',
    phone: '',
  });

  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
      const url = `${API_ENDPOINTS.USERS.LIST}?page=${currentPage}&limit=${itemsPerPage}&sort=name&order=asc${searchParam}`;
      const response = await apiService.get(url);
      if (response.success && response.data) {
        const data = response.data.data || response.data;
        const usersData = data.users || [];
        setUsers(Array.isArray(usersData) ? usersData : []);

        // Atualizar informações de paginação
        if (data.pagination) {
          setTotalPages(data.pagination.total_pages || data.pagination.totalPages || 1);
          setTotalItems(data.pagination.total || data.pagination.total_items || data.pagination.totalItems || usersData.length);
        } else {
          setTotalPages(1);
          setTotalItems(usersData.length);
        }
      } else {
        setUsers([]);
        setTotalPages(1);
        setTotalItems(0);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      setUsers([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const dataToSend = { ...formData };

      dataToSend.cpf = dataToSend.cpf.replace(/\D/g, '');
      dataToSend.phone = dataToSend.phone.replace(/\D/g, '');
      dataToSend.license_number = dataToSend.license_number.replace(/\D/g, '');

      if (editingUser && !dataToSend.password) {
        delete dataToSend.password;
      }

      if (dataToSend.type === 'ADMIN') {
        delete dataToSend.license_number;
        delete dataToSend.license_category;
        delete dataToSend.license_expiry;
      }

      let response;
      if (editingUser) {
        response = await apiService.put(
            API_ENDPOINTS.USERS.UPDATE(editingUser.id),
            dataToSend
        );

        if (response.success) {
          alert('Usuário atualizado com sucesso!');
        } else {
          alert(response.error?.message || 'Erro ao atualizar usuário');
        }
      } else {
        response = await apiService.post(API_ENDPOINTS.USERS.CREATE, dataToSend);

        if (response.success) {
          alert('Usuário cadastrado com sucesso!');
        } else {
          alert(response.error?.message || 'Erro ao cadastrar usuário');
        }
      }

      if (response?.success) {
        setShowModal(false);
        resetForm();
        setCurrentPage(1); // Voltar para primeira página após criar/editar
        loadUsers();
      }

    } catch (error) {
      alert('Erro ao salvar usuário');
    } finally {
      setFormLoading(false);
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
      license_number: user.license_number || '',
      license_category: user.license_category || '',
      license_expiry: user.license_expiry || '',
      phone: user.phone || '',
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
      // NOVOS CAMPOS: Limpa
      license_number: '',
      license_category: '',
      license_expiry: '',
      phone: '',
    });
    setEditingUser(null);
  };

  // Busca agora é feita no backend, então não precisa filtrar localmente
  const filteredUsers = users;

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
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Resetar para primeira página ao buscar
                  }}
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

          {/* Paginação */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />

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
                            name="name"
                            value={formData.name}
                            onChange={handleFormChange}
                            required
                            disabled={formLoading}
                            placeholder="Nome completo do usuário"
                        />
                      </div>
                      <div className="form-group">
                        <label>Email *</label>
                        <input
                            type="email"
                            className="form-control"
                            name="email"
                            value={formData.email}
                            onChange={handleFormChange}
                            required
                            disabled={formLoading}
                            placeholder="exemplo@empresa.com"
                        />
                      </div>
                      <div className="form-group">
                        <label>CPF *</label>
                        <input
                            type="text"
                            className="form-control"
                            name="cpf"
                            value={formData.cpf}
                            onChange={handleFormChange}
                            required
                            maxLength={14}
                            disabled={formLoading}
                            placeholder="Apenas números (Ex: 12345678900)"
                        />
                      </div>

                      <div className="form-group">
                        <label>Telefone</label>
                        <input
                            type="text"
                            className="form-control"
                            name="phone"
                            value={formData.phone}
                            onChange={handleFormChange}
                            disabled={formLoading}
                            placeholder="(XX) XXXXX-XXXX"
                        />
                      </div>

                      <div className="form-group">
                        <label>Tipo *</label>
                        <select
                            className="form-control"
                            name="type"
                            value={formData.type}
                            onChange={handleFormChange}
                            required
                            disabled={formLoading}
                        >
                          <option value="DRIVER">Motorista</option>
                          <option value="ADMIN">Administrador</option>
                        </select>
                      </div>

                      {formData.type === 'DRIVER' && (
                          <div className="driver-fields">
                            <h4 style={{marginTop: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem'}}>
                              Dados da CNH
                            </h4>
                            <div className="form-group">
                              <label>Número CNH</label>
                              <input
                                  type="text"
                                  className="form-control"
                                  name="license_number"
                                  value={formData.license_number}
                                  onChange={handleFormChange}
                                  disabled={formLoading}
                                  placeholder="Número de Registro da CNH"
                              />
                            </div>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Categoria CNH</label>
                                <select
                                    className="form-control"
                                    name="license_category"
                                    value={formData.license_category}
                                    onChange={handleFormChange}
                                    disabled={formLoading}
                                >
                                  <option value="">Selecione</option>
                                  <option value="A">A</option>
                                  <option value="B">B</option>
                                  <option value="C">C</option>
                                  <option value="D">D</option>
                                  <option value="E">E</option>
                                </select>
                              </div>
                              <div className="form-group">
                                <label>Validade CNH</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    name="license_expiry"
                                    value={formData.license_expiry}
                                    onChange={handleFormChange}
                                    disabled={formLoading}
                                />
                              </div>
                            </div>
                          </div>
                      )}


                      <div className="form-group">
                        <label>Senha {!editingUser && '*'}</label>
                        <input
                            type="password"
                            className="form-control"
                            name="password"
                            value={formData.password}
                            onChange={handleFormChange}
                            required={!editingUser}
                            minLength={6}
                            disabled={formLoading}
                            placeholder={editingUser ? 'Alterar senha...' : 'Mínimo 6 caracteres'}
                        />
                        {editingUser && <small className="text-muted">Deixe em branco para manter a senha atual</small>}
                      </div>

                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }} disabled={formLoading}>
                        <FaTimes /> Cancelar
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={formLoading}>
                        {formLoading ? 'Salvando...' : (<><FaSave /> {editingUser ? 'Atualizar' : 'Cadastrar'}</>)}
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